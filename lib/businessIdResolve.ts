import { query } from "@/lib/db";
import {
  type BusinessEntityType,
  detectBusinessEntityType,
  formatBusinessId,
  isPermanentBusinessId,
  BUSINESS_ID_PREFIX,
} from "@/lib/businessIds";

export type BusinessIdCrosswalkRow = {
  entity_type: BusinessEntityType;
  business_id: string;
  primary_ref: string;
  deprecated_ref: string | null;
  legacy_numeric: number | null;
};

let crosswalkCache: Map<string, BusinessIdCrosswalkRow> | null = null;
let crosswalkPromise: Promise<Map<string, BusinessIdCrosswalkRow>> | null = null;

function cacheKey(entityType: BusinessEntityType, ref: string): string {
  return `${entityType}:${ref}`;
}

/** Test helper */
export function resetBusinessIdCrosswalkCache(): void {
  crosswalkCache = null;
  crosswalkPromise = null;
}

async function loadCrosswalk(): Promise<Map<string, BusinessIdCrosswalkRow>> {
  if (crosswalkCache) return crosswalkCache;
  if (!crosswalkPromise) {
    crosswalkPromise = (async () => {
      const rows = await query<BusinessIdCrosswalkRow>(
        `SELECT entity_type, business_id, primary_ref, deprecated_ref, legacy_numeric::int AS legacy_numeric
         FROM business_id_crosswalk`,
      );
      const map = new Map<string, BusinessIdCrosswalkRow>();
      for (const row of rows) {
        const entityType = row.entity_type as BusinessEntityType;
        map.set(cacheKey(entityType, row.business_id), row);
        map.set(cacheKey(entityType, row.primary_ref), row);
        if (row.deprecated_ref) map.set(cacheKey(entityType, row.deprecated_ref), row);
        if (row.legacy_numeric != null) map.set(cacheKey(entityType, String(row.legacy_numeric)), row);
      }
      crosswalkCache = map;
      return map;
    })();
  }
  return crosswalkPromise;
}

function lookupCached(
  map: Map<string, BusinessIdCrosswalkRow>,
  entityType: BusinessEntityType,
  ref: string,
): BusinessIdCrosswalkRow | null {
  return map.get(cacheKey(entityType, ref)) ?? null;
}

/**
 * Resolve any known ref to the permanent business ID.
 * Order: exact business ID → crosswalk (deprecated / primary / legacy) → null.
 * Never guesses from numeric suffixes.
 */
export async function resolveBusinessId(
  entityType: BusinessEntityType,
  raw: unknown,
): Promise<string | null> {
  const ref = String(raw ?? "").trim();
  if (!ref) return null;

  if (isPermanentBusinessId(entityType, ref)) return ref;

  const detected = detectBusinessEntityType(ref);
  if (detected && detected !== entityType) return null;

  const map = await loadCrosswalk();
  const hit = lookupCached(map, entityType, ref);
  if (hit) return hit.business_id;

  return null;
}

/** Display/export ID: permanent business ID when known, else null (caller may hide). */
export async function displayBusinessId(
  entityType: BusinessEntityType,
  raw: unknown,
): Promise<string | null> {
  return resolveBusinessId(entityType, raw);
}

export async function allocateNextBusinessId(entityType: BusinessEntityType): Promise<string> {
  const { start, prefix } = BUSINESS_ID_PREFIX[entityType];
  const entityTableSql: Record<BusinessEntityType, string> = {
    company: `SELECT business_id FROM companies WHERE business_id ~ ('^' || $1 || '[0-9]+$') ORDER BY business_id DESC LIMIT 1`,
    contact: `SELECT business_id FROM contacts WHERE business_id ~ ('^' || $1 || '[0-9]+$') ORDER BY business_id DESC LIMIT 1`,
    building: `SELECT business_id FROM properties_v1 WHERE business_id ~ ('^' || $1 || '[0-9]+$') ORDER BY business_id DESC LIMIT 1`,
    premise: `SELECT business_id FROM premises_v1 WHERE business_id ~ ('^' || $1 || '[0-9]+$') ORDER BY business_id DESC LIMIT 1`,
    opportunity: `SELECT business_id FROM opportunities WHERE business_id ~ ('^' || $1 || '[0-9]+$') ORDER BY business_id DESC LIMIT 1`,
    activity: `SELECT business_id FROM activities WHERE business_id ~ ('^' || $1 || '[0-9]+$') ORDER BY business_id DESC LIMIT 1`,
  };

  const [fromCrosswalk, fromTable] = await Promise.all([
    query<{ business_id: string }>(
      `SELECT business_id FROM business_id_crosswalk
       WHERE entity_type = $1 AND business_id ~ ('^' || $2 || '[0-9]+$')
       ORDER BY business_id DESC
       LIMIT 1`,
      [entityType, prefix],
    ),
    query<{ business_id: string }>(entityTableSql[entityType], [prefix]),
  ]);

  let next = start;
  for (const row of [fromCrosswalk[0], fromTable[0]]) {
    const last = row?.business_id;
    if (!last) continue;
    const n = Number.parseInt(last.slice(prefix.length), 10);
    if (Number.isFinite(n) && n + 1 > next) next = n + 1;
  }
  return formatBusinessId(entityType, next);
}

export async function registerBusinessId(entry: {
  entityType: BusinessEntityType;
  businessId: string;
  primaryRef: string;
  deprecatedRef?: string | null;
  legacyNumeric?: number | null;
}): Promise<void> {
  // Stale wipe/re-import rows can leave primary_ref / legacy_numeric pointing at a different business_id.
  await query(
    `DELETE FROM business_id_crosswalk
     WHERE entity_type = $1
       AND business_id <> $2
       AND (
         primary_ref = $3
         OR ($4::bigint IS NOT NULL AND legacy_numeric = $4)
       )`,
    [entry.entityType, entry.businessId, entry.primaryRef, entry.legacyNumeric ?? null],
  );

  await query(
    `INSERT INTO business_id_crosswalk (entity_type, business_id, primary_ref, deprecated_ref, legacy_numeric)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (entity_type, business_id) DO UPDATE SET
       primary_ref = EXCLUDED.primary_ref,
       deprecated_ref = COALESCE(EXCLUDED.deprecated_ref, business_id_crosswalk.deprecated_ref),
       legacy_numeric = COALESCE(EXCLUDED.legacy_numeric, business_id_crosswalk.legacy_numeric)`,
    [
      entry.entityType,
      entry.businessId,
      entry.primaryRef,
      entry.deprecatedRef ?? null,
      entry.legacyNumeric ?? null,
    ],
  );
  resetBusinessIdCrosswalkCache();
}

export async function resolveCompanyBusinessId(raw: unknown): Promise<string | null> {
  return resolveBusinessId("company", raw);
}

export async function resolveContactBusinessId(raw: unknown): Promise<string | null> {
  return resolveBusinessId("contact", raw);
}

export async function resolveBuildingBusinessId(raw: unknown): Promise<string | null> {
  return resolveBusinessId("building", raw);
}

export async function resolvePremiseBusinessId(raw: unknown): Promise<string | null> {
  return resolveBusinessId("premise", raw);
}

export async function resolveOpportunityBusinessId(raw: unknown): Promise<string | null> {
  return resolveBusinessId("opportunity", raw);
}

export async function resolveActivityBusinessId(raw: unknown): Promise<string | null> {
  return resolveBusinessId("activity", raw);
}

type LegacyEntity = "company" | "contact" | "opportunity" | "activity";

const LEGACY_ENTITY_TABLE: Record<
  LegacyEntity,
  { table: string; idColumn: string; entityType: BusinessEntityType }
> = {
  company: { table: "companies", idColumn: "id", entityType: "company" },
  contact: { table: "contacts", idColumn: "id", entityType: "contact" },
  opportunity: { table: "opportunities", idColumn: "id", entityType: "opportunity" },
  activity: { table: "activities", idColumn: "id", entityType: "activity" },
};

/**
 * Ensure a legacy-table row has a permanent business_id. Allocates + registers if missing.
 * Returns the permanent ID.
 */
export async function ensureLegacyBusinessId(
  entity: LegacyEntity,
  legacyId: number | string,
  opts?: { primaryRef?: string; deprecatedRef?: string | null },
): Promise<string> {
  const id = typeof legacyId === "number" ? legacyId : Number.parseInt(String(legacyId), 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error(`Invalid ${entity} id for business_id backfill`);
  }
  legacyId = id;
  const meta = LEGACY_ENTITY_TABLE[entity];
  const rows = await query<{ business_id: string | null }>(
    `SELECT business_id FROM ${meta.table} WHERE ${meta.idColumn} = $1`,
    [legacyId],
  );
  const existing = rows[0]?.business_id?.trim();
  if (existing && isPermanentBusinessId(meta.entityType, existing)) return existing;

  const businessId = await allocateNextBusinessId(meta.entityType);
  await query(
    `UPDATE ${meta.table}
     SET business_id = $1
     WHERE ${meta.idColumn} = $2
       AND (business_id IS NULL OR trim(business_id) = '')`,
    [businessId, legacyId],
  );
  const primaryRef = opts?.primaryRef?.trim() || String(legacyId);
  await registerBusinessId({
    entityType: meta.entityType,
    businessId,
    primaryRef,
    deprecatedRef: opts?.deprecatedRef ?? null,
    legacyNumeric: legacyId,
  });
  return businessId;
}

/** Ensure properties_v1 / premises_v1 row has permanent business_id. */
export async function ensureV1BusinessId(
  entity: "building" | "premise",
  primaryId: string,
): Promise<string> {
  const id = primaryId.trim();
  if (!id) throw new Error(`Invalid ${entity} id for business_id backfill`);
  const table = entity === "building" ? "properties_v1" : "premises_v1";
  const idColumn = entity === "building" ? "property_id" : "premises_id";
  const rows = await query<{ business_id: string | null }>(
    `SELECT business_id FROM ${table} WHERE ${idColumn} = $1`,
    [id],
  );
  const existing = rows[0]?.business_id?.trim();
  if (existing && isPermanentBusinessId(entity, existing)) return existing;

  const businessId = await allocateNextBusinessId(entity);
  await query(
    `UPDATE ${table}
     SET business_id = $1
     WHERE ${idColumn} = $2
       AND (business_id IS NULL OR trim(business_id) = '')`,
    [businessId, id],
  );
  await registerBusinessId({
    entityType: entity,
    businessId,
    primaryRef: id,
    deprecatedRef: id,
  });
  return businessId;
}
