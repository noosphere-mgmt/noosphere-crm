"use client";

import { deleteCompanyAction, getCompanyReferenceSummaryAction } from "@/app/admin/companies/actions";
import { deleteContactAction } from "@/app/admin/contacts/actions";
import { deleteOpportunityAction } from "@/app/admin/opportunities/actions";
import { deletePremisesV1FromListAction } from "@/app/admin/properties/actions";

export async function confirmDeleteCompany(id: number): Promise<boolean> {
  const summary = await getCompanyReferenceSummaryAction(id);
  if (!summary) return false;
  if (summary.total > 0) {
    window.alert(
      `Cannot delete "${summary.companyName}": referenced by ${summary.total} record${summary.total === 1 ? "" : "s"}.`,
    );
    return false;
  }
  if (!window.confirm(`Delete company "${summary.companyName}"? This cannot be undone.`)) return false;
  await deleteCompanyAction(id);
  return true;
}

export async function confirmDeleteContact(label: string, id: number): Promise<boolean> {
  if (!window.confirm(`Delete contact "${label}"? This cannot be undone.`)) return false;
  await deleteContactAction(id);
  return true;
}

export async function confirmDeleteOpportunity(label: string, id: number): Promise<boolean> {
  if (!window.confirm(`Delete opportunity "${label}"? This cannot be undone.`)) return false;
  await deleteOpportunityAction(id);
  return true;
}

export async function confirmDeletePremises(label: string, premisesId: string): Promise<boolean> {
  if (!window.confirm(`Delete premise "${label}"? This cannot be undone.`)) return false;
  const result = await deletePremisesV1FromListAction(premisesId);
  if (!result.ok) {
    window.alert(result.error);
    return false;
  }
  return true;
}
