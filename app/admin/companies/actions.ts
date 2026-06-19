"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseCompanyRoles,
  parseRelationshipStrengthField,
} from "@/lib/companyFormParsing";
import type { CompanyRole } from "@/lib/types/entities";
import {
  createCompany,
  deleteCompany,
  bulkDeleteCompanies,
  getCompany,
  updateCompany,
} from "@/lib/repos/companies";
import { syncLegacyCompanyToV1 } from "@/lib/repos/companiesV1";
import { propagateCompanyRename } from "@/lib/repos/companyPropagation";
import { assertCompanyDeletable } from "@/lib/repos/companyReferences";
import { getCompanyReferenceSummary } from "@/lib/repos/companyReferences";
import { applyCompanyPatch } from "@/lib/inlineRecordMerge";
import type { PatchResult } from "@/lib/types/inlineEdit";
import { createContactAction } from "../contacts/actions";

function parseOptionalString(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function companyInputFromForm(formData: FormData) {
  const roles = parseCompanyRoles(formData);
  const coverage = formData
    .getAll("coverage")
    .map(String)
    .filter(Boolean);
  return {
    company_name: String(formData.get("company_name") ?? ""),
    company_name_zh: parseOptionalString(formData.get("company_name_zh")),
    company_name_cn: parseOptionalString(formData.get("company_name_cn")),
    roles: roles.length > 0 ? roles : (["client"] as CompanyRole[]),
    coverage,
    country: parseOptionalString(formData.get("country")) ?? "Hong Kong",
    city: parseOptionalString(formData.get("city")) ?? "Hong Kong",
    district: parseOptionalString(formData.get("district")),
    website: parseOptionalString(formData.get("website")),
    phone: parseOptionalString(formData.get("phone")),
    email: parseOptionalString(formData.get("email")),
    industry: parseOptionalString(formData.get("industry")),
    source: parseOptionalString(formData.get("source")),
    relationship_owner: parseOptionalString(formData.get("relationship_owner")),
    last_contact_date: parseOptionalString(formData.get("last_contact_date")),
    last_meeting_date: parseOptionalString(formData.get("last_meeting_date")),
    next_follow_up_date: parseOptionalString(formData.get("next_follow_up_date")),
    relationship_strength: parseRelationshipStrengthField(String(formData.get("relationship_strength") ?? "")),
    notes: parseOptionalString(formData.get("notes")),
    is_active: formData.get("is_active") === "on",
  };
}

export async function createCompanyAction(formData: FormData) {
  const input = companyInputFromForm(formData);
  const id = await createCompany(input);
  await syncLegacyCompanyToV1(id, input.company_name, input.company_name_zh ?? null, input.is_active);
  revalidatePath("/admin/companies");
  redirect(`/admin/companies?company=${id}`);
}

export async function updateCompanyAction(id: number, formData: FormData) {
  const input = companyInputFromForm(formData);
  await updateCompany(id, input);
  await syncLegacyCompanyToV1(id, input.company_name, input.company_name_zh ?? null, input.is_active);
  await propagateCompanyRename(id, input.company_name);
  revalidatePath("/admin/companies");
  revalidatePath("/admin/opportunities");
  revalidatePath("/admin/properties");
  revalidatePath(`/admin/companies/${id}`);
  redirect(`/admin/companies?company=${id}`);
}

export async function deleteCompanyAction(id: number) {
  await assertCompanyDeletable(id);
  await deleteCompany(id);
  revalidatePath("/admin/companies");
  redirect("/admin/companies");
}

export async function createCompanyContactAction(companyId: number, formData: FormData) {
  formData.set("company_id", String(companyId));
  formData.set("return_to", `/admin/companies?company=${companyId}&tab=contacts`);
  await createContactAction(formData);
}

function parseIdList(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export async function bulkDeleteCompaniesAction(formData: FormData) {
  const ids = parseIdList(String(formData.get("company_ids") ?? ""));
  if (ids.length === 0) return;
  for (const id of ids) {
    await assertCompanyDeletable(id);
  }
  await bulkDeleteCompanies(ids);
  revalidatePath("/admin/companies");
  redirect("/admin/companies");
}

export async function getCompanyReferenceSummaryAction(companyId: number) {
  return getCompanyReferenceSummary(companyId);
}

export async function patchCompanyFieldAction(
  id: number,
  field: string,
  valueJson: string,
): Promise<PatchResult> {
  try {
    const company = await getCompany(id);
    if (!company) return { ok: false, error: "Company not found" };

    let value: unknown;
    try {
      value = JSON.parse(valueJson);
    } catch {
      return { ok: false, error: "Invalid value" };
    }

    const merged = applyCompanyPatch(company, field, value);
    if ("error" in merged) return { ok: false, error: merged.error };

    await updateCompany(id, merged);
    await syncLegacyCompanyToV1(
      id,
      merged.company_name,
      merged.company_name_zh ?? null,
      merged.is_active ?? true,
    );
    if (field === "company_name") {
      await propagateCompanyRename(id, merged.company_name);
    }
    revalidatePath("/admin/companies");
    revalidatePath("/admin/opportunities");
    revalidatePath("/admin/properties");
    revalidatePath(`/admin/companies/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed" };
  }
}
