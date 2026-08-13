import { CONNECTION_COMPANY_ROLE_LABELS } from "@/lib/connectionsValues";
import { formatCompanyRoles, formatCoverage } from "@/lib/connectionsDisplay";
import { getContactLabel } from "@/lib/contactName";
import type { ConnectionCompanyListRow } from "@/lib/connectionsDisplay";
import type { CompanyRole, Contact } from "@/lib/types/entities";

function formatContactRoles(roles: CompanyRole[] | null | undefined): string {
  if (!roles?.length) return "";
  return roles.map((r) => CONNECTION_COMPANY_ROLE_LABELS[r as keyof typeof CONNECTION_COMPANY_ROLE_LABELS] ?? r).join(", ");
}

export type ConnectionsQuickFilters = {
  country: string;
  city: string;
  coverage: string[];
};

export const EMPTY_CONNECTIONS_QUICK_FILTERS: ConnectionsQuickFilters = {
  country: "",
  city: "",
  coverage: [],
};

/** @deprecated use ConnectionsQuickFilters */
export type ConnectionsListFilters = ConnectionsQuickFilters;

/** @deprecated use EMPTY_CONNECTIONS_QUICK_FILTERS */
export const EMPTY_CONNECTIONS_LIST_FILTERS = EMPTY_CONNECTIONS_QUICK_FILTERS;

export type ConnectionsRoleFilter = CompanyRole | "individual" | null;

export const CONNECTION_ROLE_QUICK_FILTERS: { role: ConnectionsRoleFilter; label: string }[] = [
  { role: null, label: "All" },
  { role: "client", label: "Client" },
  { role: "prospect", label: "Prospect" },
  { role: "investor", label: "Investor" },
  { role: "operator", label: "Operator" },
  { role: "landlord", label: "Landlord" },
  { role: "building_management", label: "Bldg Mgmt" },
  { role: "agency", label: "Agency" },
  { role: "referrer", label: "Referrer" },
  { role: "individual", label: "Individual" },
];

export function parseConnectionsRoleFilter(raw: string | null): ConnectionsRoleFilter {
  if (!raw) return null;
  if (raw === "individual") return "individual";
  return raw as CompanyRole;
}

export function fuzzyMatch(value: string | null | undefined, query: string): boolean {
  if (!query) return true;
  return (value ?? "").toLowerCase().includes(query);
}

export function matchesGlobalSearch(fields: (string | null | undefined)[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => (f ?? "").toLowerCase().includes(q));
}

export function companyMatchesRole(roles: CompanyRole[], role: ConnectionsRoleFilter): boolean {
  if (!role) return true;
  if (role === "individual") return false;
  if (roles.includes(role)) return true;
  if (role === "building_management" && roles.includes("property_management" as CompanyRole)) return true;
  if (role === "other" && roles.includes("developer" as CompanyRole)) return true;
  if (role === "other" && roles.includes("service_provider" as CompanyRole)) return true;
  return false;
}

export function formatRoleFilterLabel(role: ConnectionsRoleFilter): string {
  if (!role) return "All";
  if (role === "individual") return "Individual";
  return (CONNECTION_COMPANY_ROLE_LABELS as Record<string, string>)[role] ?? role;
}

/** Contacts that belong to the currently shortlisted companies (role/search/filter). */
export function contactsForCompanyShortlist(
  contacts: Contact[],
  companyIds: Iterable<number>,
): Contact[] {
  const ids = companyIds instanceof Set ? companyIds : new Set(companyIds);
  return contacts.filter((contact) => contact.company_id != null && ids.has(contact.company_id));
}

export function contactsWithoutCompany(contacts: Contact[]): Contact[] {
  return contacts.filter((contact) => contact.company_id == null);
}

export function matchesQuickFilters(
  row: { country?: string | null; city?: string | null; coverage?: string[] | null },
  filters: ConnectionsQuickFilters,
): boolean {
  const countryQ = filters.country.trim().toLowerCase();
  const cityQ = filters.city.trim().toLowerCase();
  const coverageValues = (row.coverage ?? []).map((value) => value.toLowerCase());
  if (countryQ && !fuzzyMatch(row.country, countryQ)) return false;
  if (cityQ && !fuzzyMatch(row.city, cityQ)) return false;
  if (filters.coverage.length > 0 && !filters.coverage.some((selected) => coverageValues.includes(selected.toLowerCase()))) return false;
  return true;
}

function withAreaCode(area: string | null | undefined, number: string | null | undefined): string {
  const digits = [area, number].map((part) => (part ?? "").replace(/\D/g, "")).filter(Boolean).join("");
  const labeled = [area, number].map((part) => (part ?? "").trim()).filter(Boolean).join(" ");
  return [labeled, digits].filter(Boolean).join(" ");
}

export function companyMatchesGlobalSearch(row: ConnectionCompanyListRow, query: string): boolean {
  return matchesGlobalSearch(
    [
      row.company_name,
      row.company_name_zh,
      row.company_name_cn,
      row.country,
      row.city,
      row.district,
      row.email,
      row.phone,
      row.website,
      row.industry,
      row.source,
      row.relationship_owner,
      row.notes,
      row.business_id,
      row.v1_company_id,
      formatCoverage(row.coverage),
      formatCompanyRoles(row.roles),
      row.primary_contact_name,
      row.primary_contact_email,
      row.primary_contact_phone,
      row.primary_contact_business_id,
    ],
    query,
  );
}

/** Left-column company search: English/Chinese names + notes only. */
export function companyMatchesNameNotesSearch(
  row: ConnectionCompanyListRow,
  query: string,
): boolean {
  return matchesGlobalSearch(
    [row.company_name, row.company_name_zh, row.company_name_cn, row.notes, row.business_id],
    query,
  );
}

/** True when the company itself matches, or any linked contact matches the query. */
export function companyMatchesSearchWithContacts(
  row: ConnectionCompanyListRow,
  companyContacts: Contact[] | undefined,
  query: string,
): boolean {
  if (!query.trim()) return true;
  if (companyMatchesGlobalSearch(row, query)) return true;
  return (companyContacts ?? []).some((contact) => contactMatchesGlobalSearch(contact, query));
}

export function contactMatchesGlobalSearch(row: Contact, query: string): boolean {
  return matchesGlobalSearch(
    [
      getContactLabel(row),
      row.contact_name,
      row.first_name,
      row.last_name,
      row.chinese_name,
      row.display_name,
      row.title,
      row.company_name,
      row.company_name_zh,
      row.company_country,
      row.company_city,
      row.company_business_id,
      formatCoverage(row.coverage),
      formatContactRoles(row.contact_role),
      row.email,
      withAreaCode(row.phone_area_code, row.phone),
      withAreaCode(row.mobile_area_code, row.mobile),
      withAreaCode(row.whatsapp_area_code, row.whatsapp),
      row.wechat,
      row.locate_at,
      row.preferred_language,
      row.notes,
      row.business_id,
      row.v1_contact_id,
    ],
    query,
  );
}

export function contactMatchesQuickFilters(row: Contact, filters: ConnectionsQuickFilters): boolean {
  const countryQ = filters.country.trim().toLowerCase();
  const cityQ = filters.city.trim().toLowerCase();
  const coverageValues = (row.coverage ?? []).map((value) => value.toLowerCase());
  if (countryQ && !fuzzyMatch(row.company_country, countryQ)) return false;
  if (cityQ && !fuzzyMatch(row.company_city, cityQ)) return false;
  if (filters.coverage.length > 0 && !filters.coverage.some((selected) => coverageValues.includes(selected.toLowerCase()))) return false;
  return true;
}
