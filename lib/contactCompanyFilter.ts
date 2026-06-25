import { isPermanentBusinessId } from "@/lib/businessIds";
import type { ContactOption } from "@/lib/repos/contacts";

export function parseCompanyId(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function contactsForCompany(
  contacts: ContactOption[],
  companyRef: number | string | null | undefined,
  companies?: { id: number; business_id?: string | null }[],
): ContactOption[] {
  const ref = String(companyRef ?? "").trim();
  if (!ref) return [];

  let legacyCompanyId: number | null = null;
  if (isPermanentBusinessId("company", ref)) {
    legacyCompanyId = companies?.find((c) => c.business_id === ref)?.id ?? null;
  } else {
    legacyCompanyId = parseCompanyId(companyRef);
  }

  if (legacyCompanyId == null) return [];
  return contacts.filter((c) => Number(c.company_id) === legacyCompanyId);
}
