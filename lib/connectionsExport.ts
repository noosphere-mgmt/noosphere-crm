import { formatCompanyRoles, formatCoverage, type ConnectionCompanyListRow } from "@/lib/connectionsDisplay";
import { companyBusinessExportId, contactBusinessExportId } from "@/lib/exportBusinessIds";
import { buildCsvContent, downloadCsvInBrowser } from "@/lib/csvEncoding";
import { buildExportFilename } from "@/lib/import/exportFilename";
import { getContactLabel } from "@/lib/contactName";
import type { Contact } from "@/lib/types/entities";

export function exportCompaniesCsv(companies: ConnectionCompanyListRow[]): void {
  const headers = [
    "ID",
    "Company",
    "Primary Contact",
    "Roles",
    "Country",
    "City",
    "Coverage",
    "Email",
    "Phone",
    "Open Opps",
    "Last Contact",
    "Notes",
  ];
  const rows = companies.map((c) => [
    companyBusinessExportId(c),
    c.company_name,
    c.primary_contact_name ?? "",
    formatCompanyRoles(c.roles),
    c.country ?? "",
    c.city ?? "",
    formatCoverage(c.coverage).replace("—", ""),
    c.email ?? "",
    c.phone ?? "",
    String(c.open_opportunities ?? 0),
    c.last_contact_date?.slice(0, 10) ?? "",
    c.notes ?? "",
  ]);
  downloadCsvInBrowser(buildExportFilename("companies"), buildCsvContent(headers, rows));
}

export function exportContactsCsv(contacts: Contact[]): void {
  const headers = [
    "ID",
    "Display Name",
    "Company",
    "Title",
    "Email",
    "Phone",
    "Coverage",
    "Primary",
    "Active",
    "Last Contact",
    "Notes",
  ];
  const rows = contacts.map((c) => [
    contactBusinessExportId(c),
    getContactLabel(c),
    c.company_name ?? "",
    c.title ?? "",
    c.email ?? "",
    c.phone ?? "",
    formatCoverage(c.coverage).replace("—", ""),
    c.is_primary ? "Yes" : "",
    c.is_active ? "Yes" : "No",
    c.last_contact_date?.slice(0, 10) ?? "",
    c.notes ?? "",
  ]);
  downloadCsvInBrowser(buildExportFilename("contacts"), buildCsvContent(headers, rows));
}
