export const CONTACT_RELATED_COMPANY_ROLES = [
  { value: "referral_partner", label: "Referral Partner" },
  { value: "introducer", label: "Introducer" },
  { value: "consultant", label: "Consultant" },
  { value: "accountant", label: "Accountant" },
  { value: "lawyer", label: "Lawyer" },
  { value: "company_secretary", label: "Company Secretary" },
  { value: "vendor_contact", label: "Vendor Contact" },
  { value: "adviser", label: "Adviser" },
  { value: "other", label: "Other" },
] as const;

export type ContactRelatedCompanyRole = (typeof CONTACT_RELATED_COMPANY_ROLES)[number]["value"];

export type ContactRelatedCompanyRef = {
  company_id: number;
  role: string;
};

const ROLE_VALUES = new Set<string>(CONTACT_RELATED_COMPANY_ROLES.map((role) => role.value));

export function isContactRelatedCompanyRole(value: string | null | undefined): value is ContactRelatedCompanyRole {
  return ROLE_VALUES.has(String(value ?? "").trim());
}

export function contactRelatedCompanyRoleLabel(role: string | null | undefined): string {
  const value = String(role ?? "").trim();
  return CONTACT_RELATED_COMPANY_ROLES.find((item) => item.value === value)?.label ?? value;
}

export function contactEligibleAsPrimeContact(
  contact: {
    company_id?: number | null;
    linked_company_ids?: number[] | null;
  },
  opportunityCompanyId: number | null | undefined,
): boolean {
  if (opportunityCompanyId == null) return true;
  const companyId = Number(opportunityCompanyId);
  if (!Number.isFinite(companyId)) return false;
  if (contact.company_id != null && Number(contact.company_id) === companyId) return true;
  return (contact.linked_company_ids ?? []).some((id) => Number(id) === companyId);
}

/** The contact's own company, so an agency person stays identifiable without a duplicate record. */
export function primeContactContext(
  contact: {
    company_id?: number | null;
    primary_company_name?: string | null;
  },
  _opportunityCompanyId: number | null | undefined,
  companies?: { id: number; company_name: string }[],
): string {
  return (
    contact.primary_company_name?.trim() ||
    companies?.find((company) => company.id === contact.company_id)?.company_name?.trim() ||
    ""
  );
}

export type PrimeContactSaveDecision =
  | { contactId: number | null }
  | { error: string };

export function primeContactSaveDecision(input: {
  nextCompanyId: number | null;
  nextContactId: number | null;
  previousCompanyId?: number | null;
  previousContactId?: number | null;
  eligible: boolean;
}): PrimeContactSaveDecision {
  if (input.nextContactId == null || input.nextCompanyId == null || input.eligible) {
    return { contactId: input.nextContactId };
  }
  const companyChanged = (input.previousCompanyId ?? null) !== input.nextCompanyId;
  const contactUnchanged = (input.previousContactId ?? null) === input.nextContactId;
  if (companyChanged && contactUnchanged) return { contactId: null };
  if (!companyChanged && contactUnchanged) return { contactId: input.nextContactId };
  return {
    error: "Prime contact must be a contact of this company or a related contact.",
  };
}
