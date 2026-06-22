import { query } from "@/lib/db";
import {
  classifyContactQueryParam,
  isV1ContactRef,
} from "@/lib/entityRefGuards";
import { resolveLegacyCompanyIdFromQuery } from "@/lib/companyDrawerResolve";

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

  if (isV1ContactRef(trimmed)) {
    const fromV1 = await query<{ legacy_contact_id: number }>(
      `SELECT legacy_contact_id::int AS legacy_contact_id
       FROM contacts_v1 WHERE contact_id = $1`,
      [trimmed],
    );
    if (fromV1[0]?.legacy_contact_id) {
      return { kind: "contact", legacyContactId: fromV1[0].legacy_contact_id };
    }

    const fromMap = await query<{ legacy_id: number }>(
      `SELECT legacy_id::int AS legacy_id
       FROM id_map_v1 WHERE entity_type = 'contact' AND new_id = $1`,
      [trimmed],
    );
    if (fromMap[0]?.legacy_id) {
      return { kind: "contact", legacyContactId: fromMap[0].legacy_id };
    }
  }

  return null;
}

export async function lookupV1ContactId(legacyContactId: number): Promise<string | null> {
  const fromV1 = await query<{ contact_id: string }>(
    `SELECT contact_id FROM contacts_v1 WHERE legacy_contact_id = $1 LIMIT 1`,
    [legacyContactId],
  );
  if (fromV1[0]?.contact_id) return fromV1[0].contact_id;

  const rows = await query<{ new_id: string }>(
    `SELECT new_id FROM id_map_v1 WHERE entity_type = 'contact' AND legacy_id = $1`,
    [legacyContactId],
  );
  return rows[0]?.new_id ?? null;
}

/** Normalize a stored company reference on a contact row to legacy companies.id. */
export async function resolveLegacyCompanyIdFromContactRef(
  companyRef: number | string | null | undefined,
): Promise<number | null> {
  if (companyRef == null) return null;
  if (typeof companyRef === "number") {
    return Number.isFinite(companyRef) && companyRef > 0 ? companyRef : null;
  }
  return resolveLegacyCompanyIdFromQuery(String(companyRef));
}
