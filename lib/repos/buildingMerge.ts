import type { QueryResult, QueryResultRow } from "pg";
import { query, withTransaction, type DbClient } from "@/lib/db";
import { getDefaultCrmOwnerName } from "@/lib/repos/crmUsers";
import {
  getPropertyV1,
  type PropertyV1,
} from "@/lib/repos/propertiesV1";
import {
  collectSearchAliases,
  compareBuildingMergeGroup,
  mergeBuildingRelationshipLines,
  resolvedMergeFieldChoices,
  resolveMergeFieldPatchFromSources,
  type BuildingMergeFieldChoices,
} from "@/lib/buildingMergeFields";
import {
  emptyMergeImpact,
  sumMergeImpact,
  type BuildingMergeImpact,
  type BuildingMergeParticipant,
  type BuildingMergePreview,
} from "@/lib/buildingMergeImpact";
import { normalizeBuildingRelationships } from "@/lib/buildingRelationships";
import { syncLegacyCompanyIdsFromBuildingRelationships } from "@/lib/buildingRelationships";

export const SQL_BUILDING_IS_ACTIVE = "merged_into_property_id IS NULL";
export {
  emptyMergeImpact,
  sumMergeImpact,
  type BuildingMergeImpact,
  type BuildingMergeParticipant,
  type BuildingMergePreview,
} from "@/lib/buildingMergeImpact";

export type MergeBuildingsInput = {
  propertyIds: string[];
  survivorPropertyId: string;
  fieldChoices?: BuildingMergeFieldChoices;
  mergedBy?: string | null;
  /** Test-only: throw after a named step so the caller can assert full rollback. */
  failAfter?: "reassign" | "archive";
};

export type MergeBuildingsResult = {
  survivorPropertyId: string;
  survivorBusinessId: string | null;
  archivedPropertyIds: string[];
  archivedBusinessIds: Array<string | null>;
  premisesTransferred: number;
  impact: BuildingMergeImpact;
  fieldResolutions: BuildingMergeFieldChoices;
  searchAliases: string[];
};

type MergeRow = {
  property_id: string;
  business_id: string | null;
  merged_into_property_id: string | null;
  external_ref: string | null;
  legacy_building_id: string | null;
};

async function rows<T extends QueryResultRow>(
  db: DbClient,
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result: QueryResult<T> = await db.query<T>(text, params);
  return result.rows;
}

export async function followMergedBuildingId(propertyId: string): Promise<string> {
  const seen = new Set<string>();
  let current = propertyId.trim();
  while (current && !seen.has(current)) {
    seen.add(current);
    const found = await query<{ property_id: string; merged_into_property_id: string | null }>(
      `SELECT property_id, merged_into_property_id FROM properties_v1 WHERE property_id = $1`,
      [current],
    );
    const next = found[0]?.merged_into_property_id?.trim();
    if (!next) return found[0]?.property_id ?? current;
    current = next;
  }
  return current;
}

export async function resolveLivePropertyId(raw: string): Promise<string | null> {
  const ref = raw.trim();
  if (!ref) return null;
  const found = await query<{ property_id: string; merged_into_property_id: string | null }>(
    `SELECT property_id, merged_into_property_id
     FROM properties_v1
     WHERE property_id = $1
        OR business_id = $1
        OR ($1 = ANY(search_aliases))
     ORDER BY CASE WHEN merged_into_property_id IS NULL THEN 0 ELSE 1 END,
              CASE WHEN property_id = $1 THEN 0 WHEN business_id = $1 THEN 1 ELSE 2 END
     LIMIT 1`,
    [ref],
  );
  if (!found[0]) return null;
  return followMergedBuildingId(found[0].property_id);
}

async function loadImpact(propertyId: string, db?: DbClient): Promise<BuildingMergeImpact> {
  const run = db
    ? <T extends QueryResultRow>(text: string, params?: unknown[]) => rows<T>(db, text, params)
    : query;
  const [row] = await run<{
    premises: string;
    opportunities: string;
    occupants: string;
    activities: string;
    companies: string;
    contacts: string;
    proposal_items: string;
    documents: string;
    relationship_lines: string;
    lease_records: string;
  }>(
    `SELECT
       (SELECT COUNT(*)::text FROM premises_v1 pm WHERE pm.property_id = p.property_id) AS premises,
       (
         SELECT COUNT(DISTINCT opp.opportunity_id)::text
         FROM opportunity_proposed_premises opp
         JOIN premises_v1 pm ON pm.premises_id = opp.premises_id
         WHERE pm.property_id = p.property_id
       ) AS opportunities,
       (
         SELECT COUNT(*)::text
         FROM premises_v1 pm
         WHERE pm.property_id = p.property_id
           AND (
             pm.current_tenant_company_id IS NOT NULL
             OR EXISTS (
               SELECT 1
               FROM jsonb_array_elements(COALESCE(pm.relationship_lines, '[]'::jsonb)) rel(line)
               WHERE COALESCE(rel.line->>'relationship_type', '') ILIKE '%occupant%'
             )
           )
       ) AS occupants,
       (
         SELECT COUNT(DISTINCT a.id)::text
         FROM activities a
         LEFT JOIN activity_premises ap ON ap.activity_id = a.activity_id
         JOIN premises_v1 pm ON pm.premises_id = COALESCE(a.premises_id, ap.premises_id)
         WHERE pm.property_id = p.property_id
       ) AS activities,
       (
         SELECT COUNT(DISTINCT company_id)::text
         FROM (
           SELECT NULLIF(TRIM(p.owner_company_id), '') AS company_id
           UNION
           SELECT NULLIF(TRIM(p.operator_company_id), '')
           UNION
           SELECT NULLIF(TRIM(p.management_company_id), '')
           UNION
           SELECT NULLIF(TRIM(p.current_tenant_company_id), '')
           UNION
           SELECT NULLIF(TRIM(rel.line->>'company_id'), '')
           FROM jsonb_array_elements(COALESCE(p.building_relationship_lines, '[]'::jsonb)) rel(line)
           UNION
           SELECT NULLIF(TRIM(pm.owner_company_id), '')
           FROM premises_v1 pm WHERE pm.property_id = p.property_id
           UNION
           SELECT NULLIF(TRIM(pm.operator_company_id), '')
           FROM premises_v1 pm WHERE pm.property_id = p.property_id
           UNION
           SELECT NULLIF(TRIM(pm.landlord_company_id), '')
           FROM premises_v1 pm WHERE pm.property_id = p.property_id
           UNION
           SELECT NULLIF(TRIM(pm.current_tenant_company_id), '')
           FROM premises_v1 pm WHERE pm.property_id = p.property_id
           UNION
           SELECT NULLIF(TRIM(rel.line->>'company_id'), '')
           FROM premises_v1 pm
           CROSS JOIN jsonb_array_elements(COALESCE(pm.relationship_lines, '[]'::jsonb)) rel(line)
           WHERE pm.property_id = p.property_id
         ) companies
         WHERE company_id IS NOT NULL
       ) AS companies,
       (
         SELECT COUNT(DISTINCT NULLIF(TRIM(rel.line->>'contact_id'), ''))::text
         FROM premises_v1 pm
         CROSS JOIN jsonb_array_elements(COALESCE(pm.relationship_lines, '[]'::jsonb)) rel(line)
         WHERE pm.property_id = p.property_id
           AND NULLIF(TRIM(rel.line->>'contact_id'), '') IS NOT NULL
       ) AS contacts,
       (
         SELECT COUNT(*)::text
         FROM opportunity_proposal_items item
         JOIN premises_v1 pm ON pm.premises_id = item.premises_id
         WHERE pm.property_id = p.property_id
       ) AS proposal_items,
       (
         SELECT COUNT(*)::text
         FROM opportunity_documents doc
         WHERE doc.opportunity_id IN (
           SELECT opp.opportunity_id
           FROM opportunity_proposed_premises opp
           JOIN premises_v1 pm ON pm.premises_id = opp.premises_id
           WHERE pm.property_id = p.property_id
         )
       ) AS documents,
       (
         SELECT COUNT(*)::text
         FROM jsonb_array_elements(COALESCE(p.building_relationship_lines, '[]'::jsonb)) rel(line)
       ) AS relationship_lines,
       (
         SELECT COUNT(*)::text
         FROM premises_v1 pm
         WHERE pm.property_id = p.property_id
           AND (
             pm.occupant_lease_commencement IS NOT NULL
             OR pm.occupant_lease_expiry IS NOT NULL
             OR NULLIF(TRIM(pm.occupant_lease_term), '') IS NOT NULL
           )
       ) AS lease_records
     FROM properties_v1 p
     WHERE p.property_id = $1`,
    [propertyId],
  );
  return {
    premises: Number.parseInt(row?.premises ?? "0", 10),
    opportunities: Number.parseInt(row?.opportunities ?? "0", 10),
    occupants: Number.parseInt(row?.occupants ?? "0", 10),
    activities: Number.parseInt(row?.activities ?? "0", 10),
    companies: Number.parseInt(row?.companies ?? "0", 10),
    contacts: Number.parseInt(row?.contacts ?? "0", 10),
    proposalItems: Number.parseInt(row?.proposal_items ?? "0", 10),
    documents: Number.parseInt(row?.documents ?? "0", 10),
    relationshipLines: Number.parseInt(row?.relationship_lines ?? "0", 10),
    leaseRecords: Number.parseInt(row?.lease_records ?? "0", 10),
  };
}

function requireActiveBuilding(row: MergeRow | undefined, label: string): MergeRow {
  if (!row) throw new Error(`${label} building was not found`);
  if (row.merged_into_property_id) {
    throw new Error(`${label} building has already been merged and cannot be used`);
  }
  return row;
}

function uniqueRefs(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ids) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

async function loadPropertiesInOrder(refs: string[]): Promise<PropertyV1[]> {
  const properties: PropertyV1[] = [];
  const seen = new Set<string>();
  for (const ref of refs) {
    const property = await getPropertyV1(ref);
    if (!property) throw new Error(`Building ${ref} was not found`);
    if (property.merged_into_property_id) {
      throw new Error(`${property.bldg_name_en || property.property_id} has already been merged and cannot be used`);
    }
    if (seen.has(property.property_id)) continue;
    seen.add(property.property_id);
    properties.push(property);
  }
  if (properties.length < 2) throw new Error("Select at least two buildings to merge");
  return properties;
}

function pickDefaultSurvivor(participants: BuildingMergeParticipant[]): string {
  return participants.reduce((best, item) =>
    item.impact.premises > best.impact.premises ? item : best,
  ).property.property_id;
}

export async function previewBuildingMerge(propertyIds: string[]): Promise<BuildingMergePreview> {
  const properties = await loadPropertiesInOrder(uniqueRefs(propertyIds));
  const buildings: BuildingMergeParticipant[] = [];
  for (const property of properties) {
    buildings.push({ property, impact: await loadImpact(property.property_id) });
  }
  const defaultSurvivorId = pickDefaultSurvivor(buildings);
  const mergedLines = mergeBuildingRelationshipLines(
    ...properties.map((property) => property.building_relationship_lines),
  );
  const survivorLines = normalizeBuildingRelationships(
    properties.find((property) => property.property_id === defaultSurvivorId)?.building_relationship_lines,
  );
  return {
    buildings,
    fields: compareBuildingMergeGroup(properties, defaultSurvivorId),
    defaultSurvivorId,
    addedRelationshipLines: Math.max(0, mergedLines.length - survivorLines.length),
  };
}

async function refreshInventoryCounts(db: DbClient, propertyId: string): Promise<void> {
  await db.query(
    `UPDATE properties_v1 p SET
       inventory_count = x.total,
       inventory_count_sales = x.sales,
       inventory_count_lease = x.lease
     FROM (
       SELECT
         $1::text AS property_id,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE COALESCE(pm.listing_intent, '') IN ('sale', 'both'))::int AS sales,
         COUNT(*) FILTER (WHERE COALESCE(pm.listing_intent, '') IN ('lease', 'both') OR pm.listing_intent IS NULL)::int AS lease
       FROM premises_v1 pm
       WHERE pm.property_id = $1
     ) x
     WHERE p.property_id = x.property_id`,
    [propertyId],
  );
}

async function remainingActiveRefs(db: DbClient, propertyIds: string[]): Promise<number> {
  if (propertyIds.length === 0) return 0;
  const [row] = await rows<{ n: string }>(
    db,
    `SELECT COUNT(*)::text AS n FROM premises_v1 WHERE property_id = ANY($1::text[])`,
    [propertyIds],
  );
  return Number.parseInt(row?.n ?? "0", 10);
}

function matchLockedRow(locked: MergeRow[], ref: string): MergeRow | undefined {
  return locked.find((row) => row.property_id === ref || row.business_id === ref);
}

export async function mergeBuildings(input: MergeBuildingsInput): Promise<MergeBuildingsResult> {
  const refs = uniqueRefs(input.propertyIds);
  const survivorRef = input.survivorPropertyId.trim();
  if (refs.length < 2) throw new Error("Select at least two buildings to merge");
  if (!survivorRef) throw new Error("Choose which building ID should survive");

  const mergedBy = input.mergedBy?.trim() || (await getDefaultCrmOwnerName());

  return withTransaction(async (db) => {
    const locked = await rows<MergeRow>(
      db,
      `SELECT property_id, business_id, merged_into_property_id, external_ref, legacy_building_id::text AS legacy_building_id
       FROM properties_v1
       WHERE property_id = ANY($1::text[]) OR business_id = ANY($1::text[])
       FOR UPDATE`,
      [[...refs, survivorRef]],
    );

    const resolvedRows: MergeRow[] = [];
    const seen = new Set<string>();
    for (const ref of refs) {
      const row = requireActiveBuilding(matchLockedRow(locked, ref), ref);
      if (seen.has(row.property_id)) continue;
      seen.add(row.property_id);
      resolvedRows.push(row);
    }
    const survivorRow = requireActiveBuilding(matchLockedRow(locked, survivorRef), "Surviving");
    if (!seen.has(survivorRow.property_id)) {
      throw new Error("The surviving building must be one of the selected buildings");
    }
    if (resolvedRows.length < 2) throw new Error("Select at least two different buildings to merge");

    const properties: PropertyV1[] = [];
    for (const row of resolvedRows) {
      const property = await getPropertyV1(row.property_id);
      if (!property) throw new Error(`Building ${row.property_id} could not be loaded for merge`);
      properties.push(property);
    }
    const survivor = properties.find((property) => property.property_id === survivorRow.property_id);
    if (!survivor) throw new Error("Surviving building could not be loaded for merge");
    const archivedProperties = properties.filter((property) => property.property_id !== survivor.property_id);
    const archivedRows = resolvedRows.filter((row) => row.property_id !== survivorRow.property_id);

    const archiveImpacts: BuildingMergeImpact[] = [];
    for (const property of archivedProperties) {
      archiveImpacts.push(await loadImpact(property.property_id, db));
    }
    const impact = sumMergeImpact(archiveImpacts);
    const fieldResolutions = resolvedMergeFieldChoices(properties, survivor.property_id, input.fieldChoices ?? {});
    for (const [key, sourceId] of Object.entries(fieldResolutions)) {
      if (sourceId && !seen.has(sourceId)) {
        throw new Error(`Field ${key} was resolved from a building that is not part of this merge`);
      }
    }
    const fieldPatch = resolveMergeFieldPatchFromSources(survivor, properties, fieldResolutions);

    const relationshipLines = mergeBuildingRelationshipLines(
      ...properties.map((property) => property.building_relationship_lines),
    );
    const syncedCompanies = syncLegacyCompanyIdsFromBuildingRelationships(relationshipLines);
    const searchAliases = collectSearchAliases(survivor, archivedProperties);
    for (const row of archivedRows) {
      const extra = row.external_ref?.trim();
      if (extra && !searchAliases.includes(extra)) searchAliases.push(extra);
    }

    const survivorLocked = resolvedRows.find((row) => row.property_id === survivor.property_id)!;
    if (!survivorLocked.external_ref?.trim()) {
      const donor = archivedRows.find((row) => row.external_ref?.trim());
      if (donor?.external_ref?.trim()) {
        await db.query(`UPDATE properties_v1 SET external_ref = NULL WHERE property_id = ANY($1::text[])`, [
          archivedRows.map((row) => row.property_id),
        ]);
        await db.query(`UPDATE properties_v1 SET external_ref = $2 WHERE property_id = $1`, [
          survivor.property_id,
          donor.external_ref,
        ]);
      }
    }
    if (!survivorLocked.legacy_building_id) {
      const donor = archivedRows.find((row) => row.legacy_building_id);
      if (donor?.legacy_building_id) {
        await db.query(`UPDATE properties_v1 SET legacy_building_id = NULL WHERE property_id = ANY($1::text[])`, [
          archivedRows.map((row) => row.property_id),
        ]);
        await db.query(`UPDATE properties_v1 SET legacy_building_id = $2::bigint WHERE property_id = $1`, [
          survivor.property_id,
          donor.legacy_building_id,
        ]);
      }
    }

    const companyValue = (
      key: "owner_company_id" | "operator_company_id" | "management_company_id" | "current_tenant_company_id",
    ) => {
      const sourceId = fieldResolutions[key];
      const source = properties.find((property) => property.property_id === sourceId) ?? survivor;
      const next = source[key];
      if (next != null && String(next).trim() !== "") return next;
      if (sourceId) return null;
      return syncedCompanies[key as keyof typeof syncedCompanies] ?? survivor[key];
    };

    const setFragments: string[] = [
      "building_relationship_lines = $2::jsonb",
      "owner_company_id = $3",
      "management_company_id = $4",
      "current_tenant_company_id = $5",
      "operator_company_id = $6",
      "search_aliases = $7::text[]",
    ];
    const params: unknown[] = [
      survivor.property_id,
      JSON.stringify(relationshipLines),
      companyValue("owner_company_id"),
      companyValue("management_company_id"),
      companyValue("current_tenant_company_id"),
      companyValue("operator_company_id"),
      searchAliases,
    ];

    for (const [key, value] of Object.entries(fieldPatch)) {
      if (
        key === "owner_company_id" ||
        key === "management_company_id" ||
        key === "current_tenant_company_id" ||
        key === "operator_company_id"
      ) {
        continue;
      }
      setFragments.push(`${key} = $${params.length + 1}`);
      params.push(value);
    }

    await db.query(
      `UPDATE properties_v1 SET ${setFragments.join(", ")} WHERE property_id = $1`,
      params,
    );

    const archivedIds = archivedRows.map((row) => row.property_id);
    await db.query(`UPDATE premises_v1 SET property_id = $1 WHERE property_id = ANY($2::text[])`, [
      survivor.property_id,
      archivedIds,
    ]);

    if (input.failAfter === "reassign") {
      throw new Error("Test-forced merge failure after reassignment");
    }

    await refreshInventoryCounts(db, survivor.property_id);
    for (const archivedId of archivedIds) {
      await refreshInventoryCounts(db, archivedId);
    }

    await db.query(
      `UPDATE properties_v1 SET
         merged_into_property_id = $2,
         merged_at = NOW(),
         merged_by = $3
       WHERE property_id = ANY($1::text[])`,
      [archivedIds, survivor.property_id, mergedBy],
    );

    if (input.failAfter === "archive") {
      throw new Error("Test-forced merge failure after archive");
    }

    const leftover = await remainingActiveRefs(db, archivedIds);
    if (leftover > 0) {
      throw new Error(`Merge aborted: ${leftover} premises still reference an archived building`);
    }

    for (const [index, archived] of archivedProperties.entries()) {
      await db.query(
        `INSERT INTO building_merge_audit (
           master_property_id, master_business_id,
           duplicate_property_id, duplicate_business_id,
           merged_by, relationship_counts, field_resolutions
         ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)`,
        [
          survivor.property_id,
          survivor.business_id ?? null,
          archived.property_id,
          archived.business_id ?? null,
          mergedBy,
          JSON.stringify(archiveImpacts[index] ?? emptyMergeImpact()),
          JSON.stringify(fieldResolutions),
        ],
      );
    }

    return {
      survivorPropertyId: survivor.property_id,
      survivorBusinessId: survivor.business_id ?? null,
      archivedPropertyIds: archivedIds,
      archivedBusinessIds: archivedProperties.map((property) => property.business_id ?? null),
      premisesTransferred: impact.premises,
      impact,
      fieldResolutions,
      searchAliases,
    };
  });
}

export async function countActiveBuildingRefs(propertyId: string): Promise<{ premises: number }> {
  const impact = await loadImpact(propertyId);
  return { premises: impact.premises };
}
