"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  normalizeCategoryPreference,
  normalizeSpaceFormPreference,
} from "@/lib/opportunityPreferences";
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
import {
  normalizeOptionalLegacyCompanyId,
  normalizeOptionalLegacyContactId,
} from "@/lib/crmRefResolve";
import { OPPORTUNITY_LEAD_TYPES } from "@/lib/lookups";
import { isClosedOpportunityStatus } from "@/lib/openOpportunityStatus";
import type { OpportunityLeadType } from "@/lib/types/entities";
import { normalizeOpportunitySource } from "@/lib/opportunitySourceValues";
import {
  isLeaseLikeSalesRole,
  isOtherSalesRole,
  isSaleCaseSalesRole,
} from "@/lib/opportunityValues";
import { getDefaultCrmOwnerName } from "@/lib/repos/crmUsers";

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

function parseLeadType(v: FormDataEntryValue | null): OpportunityLeadType {
  const s = String(v ?? "").trim();
  return (OPPORTUNITY_LEAD_TYPES as readonly string[]).includes(s) ? (s as OpportunityLeadType) : "direct_client";
}

async function opportunityInputFromForm(formData: FormData) {
  const companyId = await normalizeOptionalLegacyCompanyId(formData.get("company_id"));
  const primaryContactId = await normalizeOptionalLegacyContactId(formData.get("primary_contact_id"));
  const referrerCompanyId = await normalizeOptionalLegacyCompanyId(formData.get("referrer_company_id"));
  const referrerContactId = await normalizeOptionalLegacyContactId(formData.get("referrer_contact_id"));

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
  const status = parseOpportunityStatus(String(formData.get("status") ?? "qualifying"));
  const isLeaseLike = isLeaseLikeSalesRole(salesRole);
  const isBuy = salesRole === "to_buy";
  const isSaleCase = isSaleCaseSalesRole(salesRole);
  const isOther = isOtherSalesRole(salesRole);

  return {
    client_name: clientName || "Unknown",
    lead_type: parseLeadType(formData.get("lead_type")),
    lead_source: normalizeOpportunitySource(formData.get("lead_source")),
    company_name: companyName,
    company_id: companyId,
    primary_contact_id: primaryContactId,
    referrer_company_id: referrerCompanyId,
    referrer_contact_id: referrerContactId,
    sales_role: salesRole,
    lease_term: isLeaseLike ? parseOptionalString(formData.get("lease_term")) : null,
    expected_close_date: parseOptionalString(formData.get("expected_close_date")),
    lost_reason: isClosedOpportunityStatus(status)
      ? parseOptionalString(formData.get("lost_reason"))
      : null,
    relationship_owner: parseOptionalString(formData.get("relationship_owner")),
    budget_min: null,
    budget_max: isOther
      ? null
      : parseOptionalDecimal(formData.get("budget_max") ?? formData.get("budget")),
    required_area_sqft: isOther
      ? null
      : parseOptionalDecimal(formData.get("required_area_sqft")),
    required_capacity_pax: isLeaseLike ? parseOptionalInt(formData.get("required_capacity_pax")) : null,
    district_preference: isOther
      ? null
      : parseOptionalString(formData.get("district_preference")),
    workspace_type: isOther ? null : propertyType,
    property_type: isOther ? null : propertyType,
    property_category_preference: isOther
      ? null
      : normalizeCategoryPreference(formData.get("property_category_preference")),
    property_type_preference: isOther
      ? null
      : normalizeSpaceFormPreference(formData.get("property_type_preference")),
    target_yield: isSaleCase ? parseOptionalString(formData.get("target_yield")) : null,
    funding_status:
      isBuy ? parseOpportunityFundingStatus(formData.get("funding_status")) : null,
    move_in_date: isLeaseLike ? parseOptionalString(formData.get("move_in_date")) : null,
    status,
    waiting_for: parseOptionalString(formData.get("waiting_for")),
    next_action: parseOptionalString(formData.get("next_action")),
    next_action_date: parseOptionalString(formData.get("next_action_date")),
    requirement_summary: parseOptionalString(formData.get("requirement_summary")),
    remarks: parseOptionalString(formData.get("remarks")),
  };
}

export async function createOpportunityAction(formData: FormData) {
  const input = await opportunityInputFromForm(formData);
  input.relationship_owner ??= await getDefaultCrmOwnerName();
  const id = await createOpportunity(input);
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
  const existing = await getOpportunity(id);
  if (!existing) throw new Error("Opportunity not found");

  // The Overview form intentionally edits only part of the opportunity. Preserve
  // stored values for controls that are not rendered in the current form so a
  // small edit cannot silently clear header, pipeline or referral information.
  const preserveWhenAbsent: Array<[string, unknown]> = [
    ["client_name", existing.client_name],
    ["lead_type", existing.lead_type],
    ["company_id", existing.company_id],
    ["primary_contact_id", existing.primary_contact_id],
    ["referrer_company_id", existing.referrer_company_id],
    ["referrer_contact_id", existing.referrer_contact_id],
    ["sales_role", existing.sales_role],
    ["lease_term", existing.lease_term],
    ["expected_close_date", existing.expected_close_date],
    ["lost_reason", existing.lost_reason],
    ["relationship_owner", existing.relationship_owner],
    ["budget_max", existing.budget_max],
    ["required_area_sqft", existing.required_area_sqft],
    ["required_capacity_pax", existing.required_capacity_pax],
    ["district_preference", existing.district_preference],
    ["property_type", existing.property_type],
    ["property_category_preference", existing.property_category_preference],
    ["property_type_preference", existing.property_type_preference],
    ["target_yield", existing.target_yield],
    ["funding_status", existing.funding_status],
    ["move_in_date", existing.move_in_date],
    ["status", existing.status],
    ["waiting_for", existing.waiting_for],
    ["next_action", existing.next_action],
    ["next_action_date", existing.next_action_date],
    ["requirement_summary", existing.requirement_summary],
    ["remarks", existing.remarks],
  ];
  for (const [field, value] of preserveWhenAbsent) {
    if (!formData.has(field)) formData.set(field, value == null ? "" : String(value));
  }

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
    const legacyId = Number(id);
    if (!Number.isFinite(legacyId) || legacyId <= 0) {
      return { ok: false, error: "Invalid opportunity id" };
    }
    const opportunity = await getOpportunity(legacyId);
    if (!opportunity) return { ok: false, error: "Opportunity not found" };

    let value: unknown;
    try {
      value = JSON.parse(valueJson);
    } catch {
      return { ok: false, error: "Invalid value" };
    }

    if (field === "company_id") {
      const legacyId = await normalizeOptionalLegacyCompanyId(value);
      if (!legacyId) return { ok: false, error: "Company is required" };
      value = legacyId;
    } else if (field === "primary_contact_id" || field === "referrer_contact_id") {
      value = await normalizeOptionalLegacyContactId(value);
    } else if (field === "referrer_company_id") {
      value = await normalizeOptionalLegacyCompanyId(value);
    }

    const merged = applyOpportunityPatch(opportunity, field, value);
    if ("error" in merged) return { ok: false, error: merged.error };

    if (field === "company_id" && merged.company_id) {
      const company = await getCompany(merged.company_id);
      if (company) merged.company_name = company.company_name;
    }

    await updateOpportunity(legacyId, merged);
    revalidatePath("/admin/opportunities");
    revalidatePath(`/admin/opportunities/${legacyId}`);
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
