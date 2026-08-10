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
  companies?: { id: number; business_id?: string | null; v1_company_id?: string | null }[],
): ContactOption[] {
  const ref = String(companyRef ?? "").trim();
  if (!ref) return [];

  let selectedCompany: { id: number; business_id?: string | null; v1_company_id?: string | null } | undefined;
  if (isPermanentBusinessId("company", ref)) {
    selectedCompany = companies?.find((c) => c.business_id === ref || c.v1_company_id === ref);
  } else {
    const legacyCompanyId = parseCompanyId(companyRef);
    selectedCompany = companies?.find((c) => c.id === legacyCompanyId);
    if (!selectedCompany && legacyCompanyId != null) selectedCompany = { id: legacyCompanyId };
  }

  if (!selectedCompany) return [];
  const companyRefs = new Set(
    [String(selectedCompany.id), selectedCompany.business_id, selectedCompany.v1_company_id]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value)),
  );
  return contacts.filter((contact) => {
    const refs = [contact.company_ref, contact.company_id != null ? String(contact.company_id) : null];
    return refs.some((value) => value != null && companyRefs.has(value.trim()));
  });
}
