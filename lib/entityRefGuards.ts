/** Client-safe v1 / legacy entity ref checks (no DB imports). */

export const V1_COMPANY_ID_RE = /^COMP-\d{4}-\d{4}$/;
export const V1_CONTACT_ID_RE = /^CONT-\d{4}-\d{4}$/;

export function isV1CompanyRef(value: unknown): boolean {
  const s = String(value ?? "").trim();
  return s.startsWith("COMP-") || V1_COMPANY_ID_RE.test(s);
}

export function isV1ContactRef(value: unknown): boolean {
  const s = String(value ?? "").trim();
  return s.startsWith("CONT-") || V1_CONTACT_ID_RE.test(s);
}

/** @deprecated use isV1CompanyRef */
export const isV1CompanyId = isV1CompanyRef;

/** @deprecated use isV1ContactRef */
export const isV1ContactId = isV1ContactRef;

export function isLegacyNumericRef(value: unknown): boolean {
  const s = String(value ?? "").trim();
  return /^\d+$/.test(s) && Number.parseInt(s, 10) > 0;
}

/** Legacy contacts.id (bigint PK) only — rejects COMP-/CONT- refs. */
export function coerceLegacyContactId(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  const s = String(value).trim();
  if (!s || isV1CompanyRef(s) || isV1ContactRef(s)) return null;
  if (!/^\d+$/.test(s)) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Legacy companies.id (bigint PK) only — rejects COMP-/CONT- refs. */
export function coerceLegacyCompanyId(value: unknown): number | null {
  return coerceLegacyContactId(value);
}

export type ContactRefResolveResult =
  | { kind: "contact"; legacyContactId: number }
  | { kind: "company_mismatch"; companyQuery: string; redirectToCompany: string };

export type CompanyRefResolveResult =
  | { kind: "company"; legacyCompanyId: number }
  | { kind: "contact_mismatch"; contactQuery: string; redirectToContact: string };

/** Sync pre-check before any contact bigint SQL. */
export function classifyContactQueryParam(raw: string | undefined): ContactRefResolveResult | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (isV1CompanyRef(trimmed)) {
    return { kind: "company_mismatch", companyQuery: trimmed, redirectToCompany: trimmed };
  }

  const legacyContactId = coerceLegacyContactId(trimmed);
  if (legacyContactId != null) {
    return { kind: "contact", legacyContactId };
  }

  if (isV1ContactRef(trimmed)) {
    return null;
  }

  return null;
}

/** Sync pre-check before any company bigint SQL. */
export function classifyCompanyQueryParam(raw: string | undefined): CompanyRefResolveResult | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (isV1ContactRef(trimmed)) {
    return { kind: "contact_mismatch", contactQuery: trimmed, redirectToContact: trimmed };
  }

  const legacyCompanyId = coerceLegacyCompanyId(trimmed);
  if (legacyCompanyId != null) {
    return { kind: "company", legacyCompanyId };
  }

  if (isV1CompanyRef(trimmed)) {
    return null;
  }

  return null;
}
