/**
 * Canonical CRM entity reference resolution.
 *
 * COMP-* / CONT-* are external (v1) display/import/export refs.
 * Legacy bigint FK columns store numeric legacy IDs only.
 * V1 TEXT FK columns (properties_v1, premises_v1) store COMP-* / CONT-* refs.
 */
import { query } from "@/lib/db";
import {
  coerceLegacyCompanyId,
  coerceLegacyContactId,
  isLegacyNumericRef,
  isV1CompanyRef,
  isV1ContactRef,
} from "@/lib/entityRefGuards";
import { isPermanentBusinessId } from "@/lib/businessIds";
import {
  companyExists,
  contactExists,
  opportunityExists,
  premisesExists,
} from "@/lib/import/fkValidation";

export type ResolvedCompanyRef = {
  legacyId: number | null;
  v1Id: string | null;
  warning?: string;
};

export type ResolvedContactRef = {
  legacyId: number | null;
  v1Id: string | null;
  warning?: string;
};

export type ResolvedOpportunityRef = {
  legacyId: number | null;
  warning?: string;
};

export type ResolvedPremisesRef = {
  premisesId: string | null;
  warning?: string;
};

function trimRef(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  return s || null;
}

async function legacyCompanyIdFromV1(v1Id: string): Promise<number | null> {
  const fromV1 = await query<{ legacy_company_id: number | null }>(
    `SELECT legacy_company_id::int AS legacy_company_id
     FROM companies_v1 WHERE company_id = $1 LIMIT 1`,
    [v1Id],
  );
  if (fromV1[0]?.legacy_company_id != null) return fromV1[0].legacy_company_id;

  const fromMap = await query<{ legacy_id: number }>(
    `SELECT legacy_id::int AS legacy_id
     FROM id_map_v1 WHERE entity_type = 'company' AND new_id = $1 LIMIT 1`,
    [v1Id],
  );
  return fromMap[0]?.legacy_id ?? null;
}

async function v1CompanyIdFromLegacy(legacyId: number): Promise<string | null> {
  const fromV1 = await query<{ company_id: string }>(
    `SELECT company_id FROM companies_v1 WHERE legacy_company_id = $1 LIMIT 1`,
    [legacyId],
  );
  if (fromV1[0]?.company_id) return fromV1[0].company_id;

  const fromMap = await query<{ new_id: string }>(
    `SELECT new_id FROM id_map_v1 WHERE entity_type = 'company' AND legacy_id = $1 LIMIT 1`,
    [legacyId],
  );
  return fromMap[0]?.new_id ?? null;
}

async function legacyContactIdFromV1(v1Id: string): Promise<number | null> {
  const fromV1 = await query<{ legacy_contact_id: number | null }>(
    `SELECT legacy_contact_id::int AS legacy_contact_id
     FROM contacts_v1 WHERE contact_id = $1 LIMIT 1`,
    [v1Id],
  );
  if (fromV1[0]?.legacy_contact_id != null) return fromV1[0].legacy_contact_id;

  const fromMap = await query<{ legacy_id: number }>(
    `SELECT legacy_id::int AS legacy_id
     FROM id_map_v1 WHERE entity_type = 'contact' AND new_id = $1 LIMIT 1`,
    [v1Id],
  );
  return fromMap[0]?.legacy_id ?? null;
}

async function v1ContactIdFromLegacy(legacyId: number): Promise<string | null> {
  const fromV1 = await query<{ contact_id: string }>(
    `SELECT contact_id FROM contacts_v1 WHERE legacy_contact_id = $1 LIMIT 1`,
    [legacyId],
  );
  if (fromV1[0]?.contact_id) return fromV1[0].contact_id;

  const fromMap = await query<{ new_id: string }>(
    `SELECT new_id FROM id_map_v1 WHERE entity_type = 'contact' AND legacy_id = $1 LIMIT 1`,
    [legacyId],
  );
  return fromMap[0]?.new_id ?? null;
}

async function legacyCompanyIdFromBusinessId(businessId: string): Promise<number | null> {
  const rows = await query<{ legacy_id: number }>(
    `SELECT legacy_company_id::int AS legacy_id FROM companies_v1 WHERE business_id = $1
     UNION ALL
     SELECT id::int AS legacy_id FROM companies WHERE business_id = $1
     LIMIT 1`,
    [businessId],
  );
  return rows[0]?.legacy_id ?? null;
}

async function legacyContactIdFromBusinessId(businessId: string): Promise<number | null> {
  const rows = await query<{ legacy_id: number }>(
    `SELECT id::int AS legacy_id FROM contacts WHERE business_id = $1 LIMIT 1`,
    [businessId],
  );
  return rows[0]?.legacy_id ?? null;
}

async function legacyOpportunityIdFromBusinessId(businessId: string): Promise<number | null> {
  const rows = await query<{ legacy_id: number }>(
    `SELECT id::int AS legacy_id FROM opportunities WHERE business_id = $1 LIMIT 1`,
    [businessId],
  );
  return rows[0]?.legacy_id ?? null;
}

async function premisesIdFromBusinessId(businessId: string): Promise<string | null> {
  const rows = await query<{ premises_id: string }>(
    `SELECT premises_id FROM premises_v1 WHERE business_id = $1 LIMIT 1`,
    [businessId],
  );
  return rows[0]?.premises_id ?? null;
}

/** Resolve any company reference to legacy + v1 ids. */
export async function resolveCompanyRef(raw: unknown): Promise<ResolvedCompanyRef> {
  const s = trimRef(raw);
  if (!s) return { legacyId: null, v1Id: null };

  if (isPermanentBusinessId("company", s)) {
    const legacyId = await legacyCompanyIdFromBusinessId(s);
    if (legacyId == null) {
      return { legacyId: null, v1Id: null, warning: `Company ${s} not found` };
    }
    const v1Id = await v1CompanyIdFromLegacy(legacyId);
    return { legacyId, v1Id };
  }

  if (isV1ContactRef(s)) {
    return { legacyId: null, v1Id: null, warning: `Expected company ref, got contact ref ${s}` };
  }

  if (isV1CompanyRef(s)) {
    const legacyId = await legacyCompanyIdFromV1(s);
    return { legacyId, v1Id: s, ...(legacyId == null ? { warning: `Company ${s} has no legacy mapping` } : {}) };
  }

  const numericLegacy = coerceLegacyCompanyId(s);
  if (numericLegacy != null) {
    if (!(await companyExists(numericLegacy))) {
      return { legacyId: null, v1Id: null, warning: `Company #${numericLegacy} not found` };
    }
    const v1Id = await v1CompanyIdFromLegacy(numericLegacy);
    return { legacyId: numericLegacy, v1Id };
  }

  const byExternalRef = await query<{ id: string }>(
    `SELECT id::text AS id FROM companies WHERE external_ref = $1 LIMIT 1`,
    [s],
  );
  if (byExternalRef[0]?.id) {
    const legacyId = Number.parseInt(byExternalRef[0].id, 10);
    const v1Id = await v1CompanyIdFromLegacy(legacyId);
    return { legacyId, v1Id };
  }

  return { legacyId: null, v1Id: null, warning: `Unresolved company ref: ${s}` };
}

/** Resolve any contact reference to legacy + v1 ids. */
export async function resolveContactRef(raw: unknown): Promise<ResolvedContactRef> {
  const s = trimRef(raw);
  if (!s) return { legacyId: null, v1Id: null };

  if (isPermanentBusinessId("contact", s)) {
    const legacyId = await legacyContactIdFromBusinessId(s);
    if (legacyId == null) {
      return { legacyId: null, v1Id: null, warning: `Contact ${s} not found` };
    }
    const v1Id = await v1ContactIdFromLegacy(legacyId);
    return { legacyId, v1Id };
  }

  if (isV1CompanyRef(s)) {
    return { legacyId: null, v1Id: null, warning: `Expected contact ref, got company ref ${s}` };
  }

  if (isV1ContactRef(s)) {
    const legacyId = await legacyContactIdFromV1(s);
    return { legacyId, v1Id: s, ...(legacyId == null ? { warning: `Contact ${s} has no legacy mapping` } : {}) };
  }

  const numericLegacy = coerceLegacyContactId(s);
  if (numericLegacy != null) {
    if (!(await contactExists(numericLegacy))) {
      return { legacyId: null, v1Id: null, warning: `Contact #${numericLegacy} not found` };
    }
    const v1Id = await v1ContactIdFromLegacy(numericLegacy);
    return { legacyId: numericLegacy, v1Id };
  }

  const byExternalRef = await query<{ id: string }>(
    `SELECT id::text AS id FROM contacts WHERE external_ref = $1 LIMIT 1`,
    [s],
  );
  if (byExternalRef[0]?.id) {
    const legacyId = Number.parseInt(byExternalRef[0].id, 10);
    const v1Id = await v1ContactIdFromLegacy(legacyId);
    return { legacyId, v1Id };
  }

  return { legacyId: null, v1Id: null, warning: `Unresolved contact ref: ${s}` };
}

export async function resolveOpportunityRef(raw: unknown): Promise<ResolvedOpportunityRef> {
  const s = trimRef(raw);
  if (!s) return { legacyId: null };

  if (isPermanentBusinessId("opportunity", s)) {
    const legacyId = await legacyOpportunityIdFromBusinessId(s);
    if (legacyId == null) {
      return { legacyId: null, warning: `Opportunity ${s} not found` };
    }
    return { legacyId };
  }

  if (isLegacyNumericRef(s)) {
    const id = Number.parseInt(s, 10);
    if (await opportunityExists(id)) return { legacyId: id };
    return { legacyId: null, warning: `Opportunity #${id} not found` };
  }

  const byExternalRef = await query<{ id: string }>(
    `SELECT id::text AS id FROM opportunities WHERE external_ref = $1 LIMIT 1`,
    [s],
  );
  if (byExternalRef[0]?.id) {
    return { legacyId: Number.parseInt(byExternalRef[0].id, 10) };
  }

  return { legacyId: null, warning: `Unresolved opportunity ref: ${s}` };
}

export async function resolvePremisesRef(raw: unknown): Promise<ResolvedPremisesRef> {
  const s = trimRef(raw);
  if (!s) return { premisesId: null };

  if (isPermanentBusinessId("premise", s)) {
    const premisesId = (await premisesIdFromBusinessId(s)) ?? s;
    if (await premisesExists(premisesId)) return { premisesId };
    return { premisesId: null, warning: `Premise ${s} not found` };
  }

  if (await premisesExists(s)) return { premisesId: s };

  const byExternalRef = await query<{ premises_id: string }>(
    `SELECT premises_id FROM premises_v1 WHERE external_ref = $1 LIMIT 1`,
    [s],
  );
  if (byExternalRef[0]?.premises_id) return { premisesId: byExternalRef[0].premises_id };

  if (isLegacyNumericRef(s)) {
    const legacyId = Number.parseInt(s, 10);
    const byLegacy = await query<{ premises_id: string }>(
      `SELECT premises_id FROM premises_v1 WHERE legacy_premises_id = $1 LIMIT 1`,
      [legacyId],
    );
    if (byLegacy[0]?.premises_id) return { premisesId: byLegacy[0].premises_id };
  }

  return { premisesId: null, warning: `Unresolved premises ref: ${s}` };
}

/** Legacy companies.id for bigint FK columns. Never returns COMP/CONT strings. */
export async function resolveCompanyRefToLegacy(raw: unknown): Promise<number | null> {
  return (await resolveCompanyRef(raw)).legacyId;
}

/** companies_v1.company_id (COMP-*) for v1 TEXT FK columns. */
export async function resolveCompanyRefToV1(raw: unknown): Promise<string | null> {
  const resolved = await resolveCompanyRef(raw);
  if (resolved.v1Id) return resolved.v1Id;
  if (resolved.legacyId != null) {
    return (await v1CompanyIdFromLegacy(resolved.legacyId)) ?? null;
  }
  return null;
}

/** Legacy contacts.id for bigint FK columns. */
export async function resolveContactRefToLegacy(raw: unknown): Promise<number | null> {
  return (await resolveContactRef(raw)).legacyId;
}

/** contacts_v1.contact_id (CONT-*) for v1 TEXT FK columns. */
export async function resolveContactRefToV1(raw: unknown): Promise<string | null> {
  const resolved = await resolveContactRef(raw);
  if (resolved.v1Id) return resolved.v1Id;
  if (resolved.legacyId != null) {
    return (await v1ContactIdFromLegacy(resolved.legacyId)) ?? null;
  }
  return null;
}

export async function resolveOpportunityRefToLegacy(raw: unknown): Promise<number | null> {
  return (await resolveOpportunityRef(raw)).legacyId;
}

export async function resolvePremisesRefToId(raw: unknown): Promise<string | null> {
  return (await resolvePremisesRef(raw)).premisesId;
}

/** Normalize optional ref for legacy bigint column writes. */
export async function normalizeOptionalLegacyCompanyId(raw: unknown): Promise<number | null> {
  const s = trimRef(raw);
  if (!s) return null;
  return resolveCompanyRefToLegacy(s);
}

export async function normalizeOptionalLegacyContactId(raw: unknown): Promise<number | null> {
  const s = trimRef(raw);
  if (!s) return null;
  return resolveContactRefToLegacy(s);
}

export async function normalizeOptionalV1CompanyId(raw: unknown): Promise<string | null> {
  const s = trimRef(raw);
  if (!s) return null;
  return resolveCompanyRefToV1(s);
}

export async function normalizeOptionalV1ContactId(raw: unknown): Promise<string | null> {
  const s = trimRef(raw);
  if (!s) return null;
  return resolveContactRefToV1(s);
}

export async function normalizeOptionalLegacyOpportunityId(raw: unknown): Promise<number | null> {
  const s = trimRef(raw);
  if (!s) return null;
  return resolveOpportunityRefToLegacy(s);
}

export async function normalizeOptionalPremisesId(raw: unknown): Promise<string | null> {
  const s = trimRef(raw);
  if (!s) return null;
  return resolvePremisesRefToId(s);
}
