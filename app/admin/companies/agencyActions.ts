"use server";

import { revalidatePath } from "next/cache";
import { normalizeOptionalLegacyCompanyId } from "@/lib/crmRefResolve";
import { addCompanyAgency, removeCompanyAgency } from "@/lib/repos/companyAgencies";

type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateCompanies(companyIds: number[]) {
  revalidatePath("/admin/companies");
  revalidatePath("/admin/opportunities");
  for (const id of companyIds) revalidatePath(`/admin/companies/${id}`);
}

export async function addCompanyAgencyAction(
  companyId: number,
  agencyRef: string | number,
): Promise<ActionResult> {
  try {
    const agencyCompanyId = await normalizeOptionalLegacyCompanyId(agencyRef);
    if (!agencyCompanyId) return { ok: false, error: "Select an agency" };
    await addCompanyAgency(companyId, agencyCompanyId);
    revalidateCompanies([companyId, agencyCompanyId]);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not attach the agency" };
  }
}

export async function addAgencyClientAction(
  agencyCompanyId: number,
  companyRef: string | number,
): Promise<ActionResult> {
  try {
    const companyId = await normalizeOptionalLegacyCompanyId(companyRef);
    if (!companyId) return { ok: false, error: "Select a company" };
    await addCompanyAgency(companyId, agencyCompanyId);
    revalidateCompanies([companyId, agencyCompanyId]);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not attach the company" };
  }
}

export async function removeCompanyAgencyAction(
  linkId: number,
  companyId: number,
  agencyCompanyId: number,
): Promise<ActionResult> {
  try {
    await removeCompanyAgency(linkId);
    revalidateCompanies([companyId, agencyCompanyId]);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not remove the agency" };
  }
}
