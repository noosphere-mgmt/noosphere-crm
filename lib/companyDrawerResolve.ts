import {
  classifyCompanyQueryParam,
  isV1CompanyRef,
} from "@/lib/entityRefGuards";
import {
  resolveCompanyRefToLegacy,
  resolveCompanyRefToV1,
} from "@/lib/crmRefResolve";

export type CompanyQueryResolveResult =
  | { kind: "company"; legacyCompanyId: number }
  | { kind: "contact_mismatch"; contactQuery: string; redirectToContact: string };

export { isV1CompanyRef as isV1CompanyId } from "@/lib/entityRefGuards";

/** Resolve ?company= query param to legacy companies.id (bigint PK). */
export async function resolveLegacyCompanyIdFromQuery(
  raw: string | undefined,
): Promise<number | null> {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const classified = classifyCompanyQueryParam(trimmed);
  if (classified?.kind === "company") {
    return classified.legacyCompanyId;
  }

  if (isV1CompanyRef(trimmed) || /^\d+$/.test(trimmed)) {
    return resolveCompanyRefToLegacy(trimmed);
  }

  return null;
}

/** Resolve ?company= with cross-entity redirect support. */
export async function resolveCompanyQueryParam(
  raw: string | undefined,
): Promise<CompanyQueryResolveResult | null> {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const classified = classifyCompanyQueryParam(trimmed);
  if (classified?.kind === "contact_mismatch") {
    return classified;
  }
  if (classified?.kind === "company") {
    return classified;
  }

  const legacyCompanyId = await resolveLegacyCompanyIdFromQuery(trimmed);
  if (legacyCompanyId != null) {
    return { kind: "company", legacyCompanyId };
  }

  return null;
}

export async function lookupV1CompanyId(legacyCompanyId: number): Promise<string | null> {
  return resolveCompanyRefToV1(String(legacyCompanyId));
}
