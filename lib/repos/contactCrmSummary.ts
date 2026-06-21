import { getCompany } from "@/lib/repos/companies";
import { countOpenLinkedOpportunitiesForContact } from "@/lib/repos/connectionOpportunities";
import { getCompanyCrmSummary } from "@/lib/repos/companyCrmSummary";
import { getContact } from "@/lib/repos/contacts";
import { resolveLegacyCompanyIdFromContactRef } from "@/lib/contactDrawerResolve";

export type ContactCrmSummary = {
  openOpportunities: number;
  properties: number;
  source: string | null;
};

export async function getContactCrmSummary(contactId: number): Promise<ContactCrmSummary> {
  const [openOpportunities, contact] = await Promise.all([
    countOpenLinkedOpportunitiesForContact(contactId),
    getContact(contactId),
  ]);

  if (!contact) {
    return { openOpportunities: 0, properties: 0, source: null };
  }

  const legacyCompanyId = await resolveLegacyCompanyIdFromContactRef(contact.company_id);
  if (!legacyCompanyId) {
    return { openOpportunities, properties: 0, source: null };
  }

  const [companyCrm, company] = await Promise.all([
    getCompanyCrmSummary(legacyCompanyId),
    getCompany(legacyCompanyId),
  ]);

  return {
    openOpportunities,
    properties: companyCrm.properties,
    source: company?.source?.trim() || null,
  };
}
