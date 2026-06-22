import {
  classifyContactQueryParam,
  isV1ContactRef,
} from "@/lib/entityRefGuards";
import {
  resolveCompanyRefToLegacy,
  resolveContactRefToLegacy,
  resolveContactRefToV1,
} from "@/lib/crmRefResolve";

export type ContactQueryResolveResult =
  | { kind: "contact"; legacyContactId: number }
  | { kind: "company_mismatch"; companyQuery: string; redirectToCompany: string };

export { isV1ContactRef as isV1ContactId } from "@/lib/entityRefGuards";

/** Resolve ?contact= query param to legacy contacts.id (bigint PK). */
export async function resolveContactQueryParam(
  raw: string | undefined,
): Promise<ContactQueryResolveResult | null> {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const classified = classifyContactQueryParam(trimmed);
  if (classified?.kind === "company_mismatch") {
    return classified;
  }
  if (classified?.kind === "contact") {
    return classified;
  }

  if (isV1ContactRef(trimmed) || /^\d+$/.test(trimmed)) {
    const legacyContactId = await resolveContactRefToLegacy(trimmed);
    if (legacyContactId != null) {
      return { kind: "contact", legacyContactId };
    }
  }

  return null;
}

export async function lookupV1ContactId(legacyContactId: number): Promise<string | null> {
  return resolveContactRefToV1(String(legacyContactId));
}

/** Normalize a stored company reference on a contact row to legacy companies.id. */
export async function resolveLegacyCompanyIdFromContactRef(
  companyRef: number | string | null | undefined,
): Promise<number | null> {
  if (companyRef == null) return null;
  if (typeof companyRef === "number") {
    return Number.isFinite(companyRef) && companyRef > 0 ? companyRef : null;
  }
  return resolveCompanyRefToLegacy(String(companyRef));
}
