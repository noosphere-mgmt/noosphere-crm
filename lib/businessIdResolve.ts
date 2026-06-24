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
  const { start } = BUSINESS_ID_PREFIX[entityType];
  const rows = await query<{ business_id: string }>(
    `SELECT business_id FROM business_id_crosswalk
     WHERE entity_type = $1
     ORDER BY business_id DESC
     LIMIT 1`,
    [entityType],
  );
  let next = start;
  const last = rows[0]?.business_id;
  if (last) {
    const prefix = BUSINESS_ID_PREFIX[entityType].prefix;
    const n = Number.parseInt(last.slice(prefix.length), 10);
    if (Number.isFinite(n)) next = n + 1;
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
