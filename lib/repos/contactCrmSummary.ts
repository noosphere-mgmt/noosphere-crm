import { getCompany } from "@/lib/repos/companies";
import { countOpenLinkedOpportunitiesForContact } from "@/lib/repos/connectionOpportunities";
import { getCompanyCrmSummary } from "@/lib/repos/companyCrmSummary";
import { getContact } from "@/lib/repos/contacts";

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

  const [companyCrm, company] = await Promise.all([
    getCompanyCrmSummary(contact.company_id),
    getCompany(contact.company_id),
  ]);

  return {
    openOpportunities,
    properties: companyCrm.properties,
    source: company?.source?.trim() || null,
  };
}
