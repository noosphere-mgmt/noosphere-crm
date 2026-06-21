import { query } from "@/lib/db";
import { isV1CompanyId } from "@/lib/companyIdResolve";
import { resolveLegacyCompanyIdFromQuery } from "@/lib/companyDrawerResolve";

const V1_CONTACT_ID_RE = /^CONT-\d{4}-\d{4}$/;

export function isV1ContactId(value: string | null | undefined): boolean {
  return V1_CONTACT_ID_RE.test(value?.trim() ?? "");
}

export type ContactQueryResolveResult =
  | { kind: "contact"; legacyContactId: number }
  | { kind: "company_mismatch"; companyQuery: string };

/** Resolve ?contact= query param to legacy contacts.id (bigint PK). */
export async function resolveContactQueryParam(
  raw: string | undefined,
): Promise<ContactQueryResolveResult | null> {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (isV1CompanyId(trimmed)) {
    return { kind: "company_mismatch", companyQuery: trimmed };
  }

  if (/^\d+$/.test(trimmed)) {
    const id = Number.parseInt(trimmed, 10);
    return Number.isFinite(id) && id > 0 ? { kind: "contact", legacyContactId: id } : null;
  }

  if (isV1ContactId(trimmed)) {
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
