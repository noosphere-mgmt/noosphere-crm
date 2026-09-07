import { isPermanentBusinessId } from "@/lib/businessIds";
import { isSelectableContact } from "@/lib/contactVisibility";
import { compareContactDisplayNames, type LegacyContactSelectOption } from "@/lib/crmSelectOptions";
import type { ContactOption } from "@/lib/repos/contacts";

export function parseCompanyId(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function contactHasNoCompany(contact: ContactOption): boolean {
  return contact.company_id == null && !String(contact.company_ref ?? "").trim();
}

export function compareContactsForSelect(a: ContactOption, b: ContactOption): number {
  const byName = compareContactDisplayNames(a.contact_name ?? "", b.contact_name ?? "");
  if (byName !== 0) return byName;
  const idA = a.business_id?.trim() || `id:${a.id}`;
  const idB = b.business_id?.trim() || `id:${b.id}`;
  const byId = idA.localeCompare(idB, undefined, { numeric: true, sensitivity: "base" });
  if (byId !== 0) return byId;
  return a.id - b.id;
}

export function sortContactsAlphabetically(contacts: ContactOption[]): ContactOption[] {
  return [...contacts].sort(compareContactsForSelect);
}

export function contactMatchesSelectSearch(
  contact: ContactOption,
  query: string,
  option?: Pick<LegacyContactSelectOption, "label" | "value" | "businessId">,
): boolean {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return true;
  const haystack = [
    contact.contact_name,
    contact.chinese_name,
    contact.business_id,
    contact.v1_contact_id,
    option?.label,
    option?.value,
    option?.businessId,
  ];
  return haystack.some((part) => part != null && String(part).toLocaleLowerCase().includes(q));
}

/**
 * Contacts available for a company context.
 * - No company selected → all contacts (people can exist without a company).
 * - Company selected → that company's contacts plus company-less contacts.
 */
export function contactsForCompany(
  contacts: ContactOption[],
  companyRef: number | string | null | undefined,
  companies?: { id: number; business_id?: string | null; v1_company_id?: string | null }[],
): ContactOption[] {
  const ref = String(companyRef ?? "").trim();
  if (!ref) return sortContactsAlphabetically(contacts);

  let selectedCompany: { id: number; business_id?: string | null; v1_company_id?: string | null } | undefined;
  if (isPermanentBusinessId("company", ref)) {
    selectedCompany = companies?.find((c) => c.business_id === ref || c.v1_company_id === ref);
  } else {
    const legacyCompanyId = parseCompanyId(companyRef);
    selectedCompany = companies?.find((c) => c.id === legacyCompanyId);
    if (!selectedCompany && legacyCompanyId != null) selectedCompany = { id: legacyCompanyId };
  }

  if (!selectedCompany) return sortContactsAlphabetically(contacts);

  const companyRefs = new Set(
    [String(selectedCompany.id), selectedCompany.business_id, selectedCompany.v1_company_id]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value)),
  );

  const matched = contacts.filter((contact) => {
    if (contactHasNoCompany(contact)) return true;
    const refs = [contact.company_ref, contact.company_id != null ? String(contact.company_id) : null];
    return refs.some((value) => value != null && companyRefs.has(value.trim()));
  });

  const companyContacts: ContactOption[] = [];
  const unaffiliated: ContactOption[] = [];
  for (const contact of matched) {
    if (contactHasNoCompany(contact)) unaffiliated.push(contact);
    else companyContacts.push(contact);
  }
  return [...sortContactsAlphabetically(companyContacts), ...sortContactsAlphabetically(unaffiliated)];
}

/** Company-scoped picker list excluding inactive/archived Contact-list records. */
export function selectableContactsForCompany(
  contacts: ContactOption[],
  companyRef: number | string | null | undefined,
  companies?: { id: number; business_id?: string | null; v1_company_id?: string | null }[],
): ContactOption[] {
  return contactsForCompany(contacts, companyRef, companies).filter(isSelectableContact);
}
