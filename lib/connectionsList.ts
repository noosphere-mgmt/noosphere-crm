import { CONNECTION_COMPANY_ROLE_LABELS } from "@/lib/connectionsValues";
import { formatCoverage } from "@/lib/connectionsDisplay";
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
  coverage: string;
};

export const EMPTY_CONNECTIONS_QUICK_FILTERS: ConnectionsQuickFilters = {
  country: "",
  city: "",
  coverage: "",
};

/** @deprecated use ConnectionsQuickFilters */
export type ConnectionsListFilters = ConnectionsQuickFilters;

/** @deprecated use EMPTY_CONNECTIONS_QUICK_FILTERS */
export const EMPTY_CONNECTIONS_LIST_FILTERS = EMPTY_CONNECTIONS_QUICK_FILTERS;

export const CONNECTION_ROLE_QUICK_FILTERS: { role: CompanyRole | null; label: string }[] = [
  { role: null, label: "All" },
  { role: "client", label: "Client" },
  { role: "prospect", label: "Prospect" },
  { role: "investor", label: "Investor" },
  { role: "operator", label: "Operator" },
  { role: "landlord", label: "Landlord" },
  { role: "building_management", label: "Bldg Mgmt" },
  { role: "agency", label: "Agency" },
  { role: "referrer", label: "Referrer" },
];

export function fuzzyMatch(value: string | null | undefined, query: string): boolean {
  if (!query) return true;
  return (value ?? "").toLowerCase().includes(query);
}

export function matchesGlobalSearch(fields: (string | null | undefined)[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => (f ?? "").toLowerCase().includes(q));
}

export function companyMatchesRole(roles: CompanyRole[], role: CompanyRole | null): boolean {
  if (!role) return true;
  if (roles.includes(role)) return true;
  if (role === "building_management" && roles.includes("property_management" as CompanyRole)) return true;
  if (role === "other" && roles.includes("developer" as CompanyRole)) return true;
  if (role === "other" && roles.includes("service_provider" as CompanyRole)) return true;
  return false;
}

export function formatRoleFilterLabel(role: CompanyRole | null): string {
  if (!role) return "All";
  return (CONNECTION_COMPANY_ROLE_LABELS as Record<string, string>)[role] ?? role;
}

export function matchesQuickFilters(
  row: { country?: string | null; city?: string | null; coverage?: string[] | null },
  filters: ConnectionsQuickFilters,
): boolean {
  const countryQ = filters.country.trim().toLowerCase();
  const cityQ = filters.city.trim().toLowerCase();
  const coverageQ = filters.coverage.trim().toLowerCase();
  if (countryQ && !fuzzyMatch(row.country, countryQ)) return false;
  if (cityQ && !fuzzyMatch(row.city, cityQ)) return false;
  if (coverageQ && !fuzzyMatch(formatCoverage(row.coverage), coverageQ)) return false;
  return true;
}

export function companyMatchesGlobalSearch(row: ConnectionCompanyListRow, query: string): boolean {
  return matchesGlobalSearch(
    [
      row.company_name,
      row.company_name_zh,
      row.primary_contact_name,
      row.country,
      row.city,
      formatCoverage(row.coverage),
      row.email,
      row.phone,
      row.notes,
      row.primary_contact_email,
      row.primary_contact_phone,
    ],
    query,
  );
}

export function contactMatchesGlobalSearch(row: Contact, query: string): boolean {
  return matchesGlobalSearch(
    [
      getContactLabel(row),
      row.first_name,
      row.last_name,
      row.chinese_name,
      row.display_name,
      row.company_name,
      row.company_country,
      row.company_city,
      formatCoverage(row.coverage),
      formatContactRoles(row.contact_role),
      row.email,
      row.phone,
      row.notes,
    ],
    query,
  );
}

export function contactMatchesQuickFilters(row: Contact, filters: ConnectionsQuickFilters): boolean {
  const countryQ = filters.country.trim().toLowerCase();
  const cityQ = filters.city.trim().toLowerCase();
  const coverageQ = filters.coverage.trim().toLowerCase();
  if (countryQ && !fuzzyMatch(row.company_country, countryQ)) return false;
  if (cityQ && !fuzzyMatch(row.company_city, cityQ)) return false;
  if (coverageQ && !fuzzyMatch(formatCoverage(row.coverage), coverageQ)) return false;
  return true;
}
