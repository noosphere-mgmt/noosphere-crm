import {
  getLastActivityDateForCompany,
  getLastActivityDateForContact,
  listActivitiesForContact,
  listCompanyTimeline,
  type ActivityListRow,
} from "@/lib/repos/activities";
import { listAssetsForCompany } from "@/lib/repos/assets";
import { getCompany, listCompanyOptions } from "@/lib/repos/companies";
import {
  listLinkedOpportunitiesForCompany,
  listLinkedOpportunitiesForContact,
  type LinkedOpportunityRow,
} from "@/lib/repos/connectionOpportunities";
import { getContact, listContacts } from "@/lib/repos/contacts";
import { getCompanyCrmSummary, type CompanyCrmSummary } from "@/lib/repos/companyCrmSummary";
import { getContactCrmSummary, type ContactCrmSummary } from "@/lib/repos/contactCrmSummary";
import { lookupV1CompanyId } from "@/lib/companyDrawerResolve";
import { lookupV1ContactId, resolveLegacyCompanyIdFromContactRef } from "@/lib/contactDrawerResolve";
import { coerceLegacyContactId } from "@/lib/entityRefGuards";
import { listEntityRelationships } from "@/lib/repos/relationships";
import type { EntityRelationshipRow } from "@/lib/entityRelationships";
import type { Asset, Company, Contact } from "@/lib/types/entities";

export type CompanyDrawerData = {
  company: Company;
  v1CompanyId: string | null;
  contacts: Contact[];
  opportunities: LinkedOpportunityRow[];
  relationships: EntityRelationshipRow[];
  spaces: Asset[];
  timeline: ActivityListRow[];
  companies: { id: number; company_name: string }[];
  crmSummary: CompanyCrmSummary;
  lastActivityDate: string | null;
};

export type ContactDrawerData = {
  contact: Contact;
  v1ContactId: string | null;
  company: Company | null;
  companyCrmSummary: CompanyCrmSummary | null;
  companies: { id: number; company_name: string }[];
  opportunities: LinkedOpportunityRow[];
  relationships: EntityRelationshipRow[];
  activities: ActivityListRow[];
  spaces: Asset[];
  crmSummary: ContactCrmSummary;
  lastActivityDate: string | null;
};

export async function getCompanyDrawerData(id: number): Promise<CompanyDrawerData | null> {
  const company = await getCompany(id);
  if (!company) return null;

  const [contacts, opportunities, relationships, spaces, timeline, companies, crmSummary, lastActivityDate, v1CompanyId] =
    await Promise.all([
      listContacts(id),
      listLinkedOpportunitiesForCompany(id),
      listEntityRelationships("company", id),
      listAssetsForCompany(id),
      listCompanyTimeline(id).catch(() => [] as ActivityListRow[]),
      listCompanyOptions(),
      getCompanyCrmSummary(id),
      getLastActivityDateForCompany(id).catch(() => null),
      lookupV1CompanyId(id),
    ]);

  return { company, v1CompanyId, contacts, opportunities, relationships, spaces, timeline, companies, crmSummary, lastActivityDate };
}

export async function getContactDrawerData(id: number | string): Promise<ContactDrawerData | null> {
  const legacyId = coerceLegacyContactId(id);
  if (legacyId == null) return null;

  const contact = await getContact(legacyId);
  if (!contact) return null;

  const legacyCompanyId = await resolveLegacyCompanyIdFromContactRef(contact.company_id);

  const [company, companies, opportunities, relationships, activities, spaces, crmSummary, companyCrmSummary, lastActivityDate, v1ContactId] =
    await Promise.all([
      legacyCompanyId ? getCompany(legacyCompanyId) : Promise.resolve(null),
      listCompanyOptions(),
      listLinkedOpportunitiesForContact(legacyId),
      listEntityRelationships("contact", legacyId),
      listActivitiesForContact(legacyId).catch(() => [] as ActivityListRow[]),
      legacyCompanyId ? listAssetsForCompany(legacyCompanyId) : Promise.resolve([]),
      getContactCrmSummary(legacyId),
      legacyCompanyId ? getCompanyCrmSummary(legacyCompanyId) : Promise.resolve(null),
      getLastActivityDateForContact(legacyId).catch(() => null),
      lookupV1ContactId(legacyId),
    ]);

  return {
    contact,
    v1ContactId,
    company,
    companyCrmSummary,
    companies,
    opportunities,
    relationships,
    activities,
    spaces,
    crmSummary,
    lastActivityDate,
  };
}
