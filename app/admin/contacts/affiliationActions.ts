"use server";

import { revalidatePath } from "next/cache";
import {
  addContactCompanyAffiliation,
  removeContactCompanyAffiliation,
  setPrimaryContactCompanyAffiliation,
} from "@/lib/repos/contactCompanyAffiliations";
import { normalizeOptionalLegacyCompanyId } from "@/lib/crmRefResolve";

export type AffiliationActionResult = { ok: true } | { ok: false; error: string };

function revalidate(contactId: number) {
  revalidatePath("/admin/contacts");
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/contacts/${contactId}`);
}

export async function addContactCompanyAffiliationAction(
  contactId: number,
  input: {
    company_id: string;
    job_title?: string;
    role?: string;
    is_primary?: boolean;
  },
): Promise<AffiliationActionResult> {
  try {
    const companyId = await normalizeOptionalLegacyCompanyId(input.company_id);
    if (companyId == null) return { ok: false, error: "Company not found" };
    await addContactCompanyAffiliation(contactId, {
      company_id: companyId,
      job_title: input.job_title,
      role: input.role,
      is_primary: input.is_primary,
    });
    revalidate(contactId);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to add affiliation" };
  }
}

export async function setPrimaryContactCompanyAffiliationAction(
  contactId: number,
  affiliationId: number,
): Promise<AffiliationActionResult> {
  try {
    await setPrimaryContactCompanyAffiliation(contactId, affiliationId);
    revalidate(contactId);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to set primary" };
  }
}

export async function removeContactCompanyAffiliationAction(
  contactId: number,
  affiliationId: number,
): Promise<AffiliationActionResult> {
  try {
    await removeContactCompanyAffiliation(contactId, affiliationId);
    revalidate(contactId);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to remove affiliation" };
  }
}
