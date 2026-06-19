import { formatCompanyRoles, formatCoverage, type ConnectionCompanyListRow } from "@/lib/connectionsDisplay";
import { getContactLabel } from "@/lib/contactName";
import type { Contact } from "@/lib/types/entities";

function escapeCsv(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const lines = [headers.map(escapeCsv).join(","), ...rows.map((r) => r.map(escapeCsv).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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
    String(c.id),
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
  downloadCsv(`companies-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
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
    String(c.id),
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
  downloadCsv(`contacts-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
}
