import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";

export type LegacyCompanySelectOption = {
  value: string;
  label: string;
  v1Id: string | null;
};

export type LegacyContactSelectOption = {
  value: string;
  label: string;
  v1Id: string | null;
};

export function formatLabelWithBusinessId(name: string, businessId?: string | null): string {
  const id = businessId?.trim();
  const trimmedName = name.trim() || "—";
  return id ? `${trimmedName} (${id})` : trimmedName;
}

function v1CompanyByLegacy(companies: CompanyV1Option[]): Map<number, CompanyV1Option> {
  const map = new Map<number, CompanyV1Option>();
  for (const c of companies) {
    if (c.legacy_company_id != null) map.set(c.legacy_company_id, c);
  }
  return map;
}

function v1ContactByLegacy(contacts: ContactV1Option[]): Map<number, ContactV1Option> {
  const map = new Map<number, ContactV1Option>();
  for (const c of contacts) {
    if (c.legacy_contact_id != null) map.set(c.legacy_contact_id, c);
  }
  return map;
}

/** Legacy CRM company dropdown: value = companies.id, label = Name (COMP-*). */
export function toLegacyCompanySelectOptions(
  companies: { id: number; company_name: string; v1_company_id?: string | null }[],
  v1Companies: CompanyV1Option[] = [],
): LegacyCompanySelectOption[] {
  const v1ByLegacy = v1CompanyByLegacy(v1Companies);
  return companies.map((c) => {
    const v1Id = c.v1_company_id ?? v1ByLegacy.get(c.id)?.company_id ?? null;
    return {
      value: String(c.id),
      label: formatLabelWithBusinessId(c.company_name, v1Id),
      v1Id,
    };
  });
}

/** Legacy CRM contact dropdown: value = contacts.id, label = Name (CONT-*). */
export function toLegacyContactSelectOptions(
  contacts: { id: number; contact_name: string; company_id?: number | null; v1_contact_id?: string | null }[],
  v1Contacts: ContactV1Option[] = [],
): LegacyContactSelectOption[] {
  const v1ByLegacy = v1ContactByLegacy(v1Contacts);
  return contacts.map((c) => {
    const v1Id = c.v1_contact_id ?? v1ByLegacy.get(c.id)?.contact_id ?? null;
    return {
      value: String(c.id),
      label: formatLabelWithBusinessId(c.contact_name, v1Id),
      v1Id,
    };
  });
}

export function formatLegacyCompanyOptionLabel(
  companyName: string,
  _legacyId: number,
  v1Id?: string | null,
): string {
  return formatLabelWithBusinessId(companyName, v1Id);
}
