import { contactIsEligiblePrimeContact } from "@/lib/repos/contactRelatedCompanies";
import { primeContactSaveDecision } from "@/lib/contactRelatedCompanies";

export async function applyPrimeContactRule(
  input: { company_id?: number | null; primary_contact_id?: number | null },
  previous?: { company_id?: number | null; primary_contact_id?: number | null } | null,
): Promise<void> {
  const nextCompanyId = input.company_id ?? null;
  const nextContactId = input.primary_contact_id ?? null;
  const eligible =
    nextCompanyId == null || nextContactId == null
      ? true
      : await contactIsEligiblePrimeContact(nextContactId, nextCompanyId);
  const decision = primeContactSaveDecision({
    nextCompanyId,
    nextContactId,
    previousCompanyId: previous?.company_id ?? null,
    previousContactId: previous?.primary_contact_id ?? null,
    eligible,
  });
  if ("error" in decision) throw new Error(decision.error);
  input.primary_contact_id = decision.contactId;
}
