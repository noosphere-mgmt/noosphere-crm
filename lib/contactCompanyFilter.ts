import type { ContactOption } from "@/lib/repos/contacts";

export function parseCompanyId(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function contactsForCompany(
  contacts: ContactOption[],
  companyId: number | string | null | undefined,
): ContactOption[] {
  const cid = parseCompanyId(companyId);
  if (cid == null) return [];
  return contacts.filter((c) => Number(c.company_id) === cid);
}
