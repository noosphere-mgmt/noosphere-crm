"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseOpportunityFundingStatus,
  parseOpportunitySalesRole,
  parseOpportunityStatus,
} from "@/lib/opportunityFormParsing";
import { getCompany } from "@/lib/repos/companies";
import { getContact } from "@/lib/repos/contacts";
import {
  createOpportunity,
  deleteOpportunity,
  bulkDeleteOpportunities,
  getOpportunity,
  updateOpportunity,
} from "@/lib/repos/opportunities";
import { applyOpportunityPatch } from "@/lib/inlineRecordMerge";
import { OPPORTUNITY_LEAD_TYPES } from "@/lib/lookups";
import { isClosedOpportunityStatus } from "@/lib/openOpportunityStatus";
import type { OpportunityLeadType } from "@/lib/types/entities";

function parseOptionalDecimal(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalInt(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalString(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function parseOptionalId(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseLeadType(v: FormDataEntryValue | null): OpportunityLeadType {
  const s = String(v ?? "").trim();
  return (OPPORTUNITY_LEAD_TYPES as readonly string[]).includes(s) ? (s as OpportunityLeadType) : "direct_client";
}

async function opportunityInputFromForm(formData: FormData) {
  const companyId = parseOptionalId(formData.get("company_id"));
  const primaryContactId = parseOptionalId(formData.get("primary_contact_id"));
  const referrerCompanyId = parseOptionalId(formData.get("referrer_company_id"));
  const referrerContactId = parseOptionalId(formData.get("referrer_contact_id"));

  let clientName = String(formData.get("client_name") ?? "").trim();
  let companyName: string | null = null;

  if (primaryContactId && !clientName) {
    const contact = await getContact(primaryContactId);
    if (contact) clientName = contact.contact_name;
  }

  if (companyId) {
    const company = await getCompany(companyId);
    if (company) companyName = company.company_name;
  }

  const salesRole = parseOpportunitySalesRole(formData.get("sales_role"));
  const propertyType = parseOptionalString(formData.get("property_type"));
  const status = parseOpportunityStatus(String(formData.get("status") ?? "new"));
  const expectedCloseDate =
    salesRole === "to_lease" ? parseOptionalString(formData.get("expected_close_date")) : null;

  return {
    client_name: clientName || "Unknown",
    lead_type: parseLeadType(formData.get("lead_type")),
    company_name: companyName,
    company_id: companyId,
    primary_contact_id: primaryContactId,
    referrer_company_id: referrerCompanyId,
    referrer_contact_id: referrerContactId,
    sales_role: salesRole,
    lease_term: salesRole === "to_lease" ? parseOptionalString(formData.get("lease_term")) : null,
    expected_close_date: expectedCloseDate,
    lost_reason: isClosedOpportunityStatus(status)
      ? parseOptionalString(formData.get("lost_reason"))
      : null,
    relationship_owner: parseOptionalString(formData.get("relationship_owner")),
    budget_min: null,
    budget_max: parseOptionalDecimal(formData.get("budget_max") ?? formData.get("budget")),
    required_area_sqft: parseOptionalDecimal(formData.get("required_area_sqft")),
    required_capacity_pax:
      salesRole === "to_lease" ? parseOptionalInt(formData.get("required_capacity_pax")) : null,
    district_preference: parseOptionalString(formData.get("district_preference")),
    workspace_type: propertyType,
    property_type: propertyType,
    target_yield: salesRole === "to_buy" ? parseOptionalString(formData.get("target_yield")) : null,
    funding_status:
      salesRole === "to_buy" ? parseOpportunityFundingStatus(formData.get("funding_status")) : null,
    move_in_date: salesRole === "to_lease" ? expectedCloseDate : null,
    status,
    requirement_summary: parseOptionalString(formData.get("requirement_summary")),
    remarks: parseOptionalString(formData.get("remarks")),
  };
}

export async function createOpportunityAction(formData: FormData) {
  const id = await createOpportunity(await opportunityInputFromForm(formData));
  revalidatePath("/admin/opportunities");
  revalidatePath("/admin/companies");
  const returnTo = parseOptionalString(formData.get("return_to"));
  if (returnTo) {
    const sep = returnTo.includes("?") ? "&" : "?";
    redirect(`${returnTo}${sep}opportunity=${id}`);
  }
  redirect(`/admin/opportunities/${id}`);
}

export async function updateOpportunityAction(id: number, formData: FormData) {
  const input = await opportunityInputFromForm(formData);
  await updateOpportunity(id, input);
  revalidatePath("/admin/opportunities");
  revalidatePath(`/admin/opportunities/${id}`);
  if (input.company_id) revalidatePath(`/admin/companies/${input.company_id}`);
  const returnTo = parseOptionalString(formData.get("return_to"));
  if (returnTo) redirect(returnTo);
  redirect(`/admin/opportunities/${id}`);
}

type PatchResult = { ok: true } | { ok: false; error: string };

export async function patchOpportunityFieldAction(
  id: number,
  field: string,
  valueJson: string,
): Promise<PatchResult> {
  try {
    const opportunity = await getOpportunity(id);
    if (!opportunity) return { ok: false, error: "Opportunity not found" };

    let value: unknown;
    try {
      value = JSON.parse(valueJson);
    } catch {
      return { ok: false, error: "Invalid value" };
    }

    const merged = applyOpportunityPatch(opportunity, field, value);
    if ("error" in merged) return { ok: false, error: merged.error };

    if (field === "company_id" && merged.company_id) {
      const company = await getCompany(merged.company_id);
      if (company) merged.company_name = company.company_name;
    }

    await updateOpportunity(id, merged);
    revalidatePath("/admin/opportunities");
    revalidatePath(`/admin/opportunities/${id}`);
    if (merged.company_id) revalidatePath(`/admin/companies/${merged.company_id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed" };
  }
}

export async function deleteOpportunityFromDetailAction(id: number) {
  await deleteOpportunity(id);
  revalidatePath("/admin/opportunities");
  revalidatePath("/admin/companies");
  redirect("/admin/opportunities");
}

export async function deleteOpportunityAction(id: number) {
  await deleteOpportunity(id);
  revalidatePath("/admin/opportunities");
  revalidatePath("/admin/companies");
  redirect("/admin/opportunities");
}

function parseIdList(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export async function bulkDeleteOpportunitiesAction(formData: FormData) {
  const ids = parseIdList(String(formData.get("opportunity_ids") ?? ""));
  if (ids.length === 0) return;
  await bulkDeleteOpportunities(ids);
  revalidatePath("/admin/opportunities");
  revalidatePath("/admin/companies");
  redirect("/admin/opportunities");
}
