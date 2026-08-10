import {
  classifyCompanyQueryParam,
} from "@/lib/entityRefGuards";
import {
  resolveCompanyRefToLegacy,
  resolveCompanyRefToV1,
} from "@/lib/crmRefResolve";

export type CompanyQueryResolveResult =
  | { kind: "company"; legacyCompanyId: number }
  | { kind: "contact_mismatch"; contactQuery: string; redirectToContact: string };

export { isV1CompanyRef as isV1CompanyId } from "@/lib/entityRefGuards";

/** Resolve ?company= query param (or full-page path id) to legacy companies.id. */
export async function resolveLegacyCompanyIdFromQuery(
  raw: string | undefined,
): Promise<number | null> {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const classified = classifyCompanyQueryParam(trimmed);
  if (classified?.kind === "company") {
    return classified.legacyCompanyId;
  }

  // Permanent business ID (C100001), COMP-*, numeric, or other known refs.
  return resolveCompanyRefToLegacy(trimmed);
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
