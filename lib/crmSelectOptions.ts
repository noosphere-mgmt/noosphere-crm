import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import { isPermanentBusinessId } from "@/lib/businessIds";
import { contactVisibilitySuffix } from "@/lib/contactVisibility";

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

export function formatContactOptionLabel(
  name: string,
  businessId?: string | null,
  isActive?: boolean | null,
): string {
  return `${formatLabelWithBusinessId(name, businessId)}${contactVisibilitySuffix(isActive)}`;
}

export function opportunityPrimaryContactLabel(opportunity: {
  primary_contact_name?: string | null;
  primary_contact_is_active?: boolean | null;
}): string {
  const name = opportunity.primary_contact_name?.trim();
  if (!name) return "";
  return `${name}${contactVisibilitySuffix(opportunity.primary_contact_is_active)}`;
}

/** Case-insensitive A–Z compare. Callers should tie-break by contact ID for determinism. */
export function compareContactDisplayNames(a: string, b: string): number {
  return a.trim().localeCompare(b.trim(), undefined, { sensitivity: "base", numeric: true });
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

/** Company dropdown: value = permanent business ID (C100001), legacy numeric id as fallback. */
export function toLegacyCompanySelectOptions(
  companies: { id: number; company_name: string; business_id?: string | null; v1_company_id?: string | null }[],
  v1Companies: CompanyV1Option[] = [],
): LegacyCompanySelectOption[] {
  const v1ByLegacy = v1CompanyByLegacy(v1Companies);
  return companies.map((c) => {
    const businessId =
      c.business_id?.trim() ||
      v1ByLegacy.get(c.id)?.business_id?.trim() ||
      null;
    const value = businessId ?? String(c.id);
    return {
      value,
      label: formatLabelWithBusinessId(c.company_name, businessId),
      businessId,
    };
  });
}

/** Contact dropdown: value = permanent business ID (D100001), legacy numeric id as fallback. */
export function toLegacyContactSelectOptions(
  contacts: {
    id: number;
    contact_name: string;
    business_id?: string | null;
    company_id?: number | null;
    v1_contact_id?: string | null;
    is_active?: boolean | null;
  }[],
  v1Contacts: ContactV1Option[] = [],
): LegacyContactSelectOption[] {
  const v1ByLegacy = v1ContactByLegacy(v1Contacts);
  return contacts
    .map((c) => {
      const businessId = c.business_id?.trim() || v1ByLegacy.get(c.id)?.business_id?.trim() || null;
      const value = businessId ?? String(c.id);
      return {
        value,
        label: formatContactOptionLabel(c.contact_name, businessId, c.is_active),
        businessId,
      };
    })
    .sort((a, b) => {
      const byLabel = compareContactDisplayNames(a.label, b.label);
      if (byLabel !== 0) return byLabel;
      return a.value.localeCompare(b.value, undefined, { numeric: true });
    });
}

export function formatLegacyCompanyOptionLabel(
  companyName: string,
  _legacyId: number,
  businessId?: string | null,
): string {
  return formatLabelWithBusinessId(companyName, businessId);
}

/** Map legacy numeric / business ref to canonical company select value (C######). */
export function resolveCompanySelectValue(
  companies: { id: number; business_id?: string | null }[],
  ref: number | string | null | undefined,
): string {
  if (ref == null || ref === "") return "";
  const s = String(ref).trim();
  if (isPermanentBusinessId("company", s)) return s;
  const legacyId = Number.parseInt(s, 10);
  if (Number.isFinite(legacyId) && legacyId > 0) {
    const company = companies.find((c) => String(c.id) === String(legacyId));
    return company?.business_id?.trim() || String(legacyId);
  }
  return "";
}

/** Map legacy numeric / business ref to canonical contact select value (D######). */
export function resolveContactSelectValue(
  contacts: { id: number; business_id?: string | null }[],
  ref: number | string | null | undefined,
): string {
  if (ref == null || ref === "") return "";
  const s = String(ref).trim();
  if (isPermanentBusinessId("contact", s)) return s;
  const legacyId = Number.parseInt(s, 10);
  if (Number.isFinite(legacyId) && legacyId > 0) {
    const contact = contacts.find((c) => String(c.id) === String(legacyId));
    return contact?.business_id?.trim() || String(legacyId);
  }
  return "";
}
