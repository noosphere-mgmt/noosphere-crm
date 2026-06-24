import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";

export type LegacyCompanySelectOption = {
  value: string;
  label: string;
  businessId: string | null;
};

export type LegacyContactSelectOption = {
  value: string;
  label: string;
  businessId: string | null;
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

/** Company dropdown: value = permanent business ID (C100001). */
export function toLegacyCompanySelectOptions(
  companies: { id: number; company_name: string; business_id?: string | null; v1_company_id?: string | null }[],
  v1Companies: CompanyV1Option[] = [],
): LegacyCompanySelectOption[] {
  const v1ByLegacy = v1CompanyByLegacy(v1Companies);
  return companies
    .map((c) => {
      const businessId =
        c.business_id?.trim() ||
        v1ByLegacy.get(c.id)?.business_id?.trim() ||
        null;
      if (!businessId) return null;
      const option: LegacyCompanySelectOption = {
        value: businessId,
        label: formatLabelWithBusinessId(c.company_name, businessId),
        businessId,
      };
      return option;
    })
    .filter((o): o is LegacyCompanySelectOption => o != null);
}

/** Contact dropdown: value = permanent business ID (D100001). */
export function toLegacyContactSelectOptions(
  contacts: {
    id: number;
    contact_name: string;
    business_id?: string | null;
    company_id?: number | null;
    v1_contact_id?: string | null;
  }[],
  v1Contacts: ContactV1Option[] = [],
): LegacyContactSelectOption[] {
  const v1ByLegacy = v1ContactByLegacy(v1Contacts);
  return contacts
    .map((c) => {
      const businessId = c.business_id?.trim() || v1ByLegacy.get(c.id)?.business_id?.trim() || null;
      if (!businessId) return null;
      const option: LegacyContactSelectOption = {
        value: businessId,
        label: formatLabelWithBusinessId(c.contact_name, businessId),
        businessId,
      };
      return option;
    })
    .filter((o): o is LegacyContactSelectOption => o != null);
}

export function formatLegacyCompanyOptionLabel(
  companyName: string,
  _legacyId: number,
  businessId?: string | null,
): string {
  return formatLabelWithBusinessId(companyName, businessId);
}
