import { query } from "@/lib/db";
import { loadCompanyLookupMaps } from "@/lib/companyV1Resolve";
import { resolveToV1CompanyId } from "@/lib/companyIdResolve";
import {
  activityExists,
  buildingExists,
  companyExists,
  contactExists,
  opportunityExists,
  parseOptionalText,
  premisesExists,
} from "./fkValidation";

export type ReferenceValidationResult = {
  errors: string[];
  warnings: string[];
  /** Patches merged into patch.writable before create/update */
  writablePatches: Record<string, unknown>;
};

export function emptyReferenceResult(): ReferenceValidationResult {
  return { errors: [], warnings: [], writablePatches: {} };
}

export function mergeReferenceResults(...parts: ReferenceValidationResult[]): ReferenceValidationResult {
  const merged = emptyReferenceResult();
  for (const part of parts) {
    merged.errors.push(...part.errors);
    merged.warnings.push(...part.warnings);
    Object.assign(merged.writablePatches, part.writablePatches);
  }
  return merged;
}

export function optionalRelationshipWarning(field: string): string {
  return `Optional relationship not resolved: ${field}`;
}

async function lookupCompanyV1Id(raw: string): Promise<string | null> {
  const direct = await query<{ company_id: string }>(
    `SELECT company_id FROM companies_v1 WHERE company_id = $1 LIMIT 1`,
    [raw],
  );
  if (direct[0]?.company_id) return direct[0].company_id;

  const maps = await loadCompanyLookupMaps();
  const fromMaps = resolveToV1CompanyId(raw, maps);
  if (fromMaps) {
    const exists = await query<{ ok: number }>(
      `SELECT 1 AS ok FROM companies_v1 WHERE company_id = $1 LIMIT 1`,
      [fromMaps],
    );
    if (exists.length > 0) return fromMaps;
  }

  const byExternalRef = await query<{ company_id: string }>(
    `SELECT cv1.company_id
     FROM companies c
     JOIN companies_v1 cv1 ON cv1.legacy_company_id = c.id
     WHERE c.external_ref = $1
     LIMIT 1`,
    [raw],
  );
  return byExternalRef[0]?.company_id ?? null;
}

async function lookupLegacyCompanyId(raw: string): Promise<number | null> {
  if (/^\d+$/.test(raw)) {
    const id = Number.parseInt(raw, 10);
    if (await companyExists(id)) return id;
  }

  const byExternalRef = await query<{ id: string }>(
    `SELECT id::text FROM companies WHERE external_ref = $1 LIMIT 1`,
    [raw],
  );
  if (byExternalRef[0]?.id) return Number.parseInt(byExternalRef[0].id, 10);

  return null;
}

async function lookupBuildingId(raw: string): Promise<string | null> {
  if (await buildingExists(raw)) return raw;

  const byExternalRef = await query<{ property_id: string }>(
    `SELECT property_id FROM properties_v1 WHERE external_ref = $1 LIMIT 1`,
    [raw],
  );
  if (byExternalRef[0]?.property_id) return byExternalRef[0].property_id;

  if (/^\d+$/.test(raw)) {
    const legacyId = Number.parseInt(raw, 10);
    const byLegacy = await query<{ property_id: string }>(
      `SELECT property_id FROM properties_v1 WHERE legacy_building_id = $1 LIMIT 1`,
      [legacyId],
    );
    if (byLegacy[0]?.property_id) return byLegacy[0].property_id;
  }

  return null;
}

async function lookupContactId(raw: string): Promise<number | null> {
  if (/^\d+$/.test(raw)) {
    const id = Number.parseInt(raw, 10);
    if (await contactExists(id)) return id;
  }

  const byExternalRef = await query<{ id: string }>(
    `SELECT id::text FROM contacts WHERE external_ref = $1 LIMIT 1`,
    [raw],
  );
  if (byExternalRef[0]?.id) return Number.parseInt(byExternalRef[0].id, 10);

  return null;
}

async function lookupOpportunityId(raw: string): Promise<number | null> {
  if (/^\d+$/.test(raw)) {
    const id = Number.parseInt(raw, 10);
    if (await opportunityExists(id)) return id;
  }

  const byExternalRef = await query<{ id: string }>(
    `SELECT id::text FROM opportunities WHERE external_ref = $1 LIMIT 1`,
    [raw],
  );
  if (byExternalRef[0]?.id) return Number.parseInt(byExternalRef[0].id, 10);

  return null;
}

async function lookupPremisesId(raw: string): Promise<string | null> {
  if (await premisesExists(raw)) return raw;

  const byExternalRef = await query<{ premises_id: string }>(
    `SELECT premises_id FROM premises_v1 WHERE external_ref = $1 LIMIT 1`,
    [raw],
  );
  return byExternalRef[0]?.premises_id ?? null;
}

async function lookupActivityId(raw: string): Promise<string | null> {
  if (await activityExists(raw)) return raw;
  return null;
}

type ReferenceKind = "company_v1" | "legacy_company" | "building" | "contact" | "opportunity" | "premises" | "activity";

async function resolveReference(
  field: string,
  raw: unknown,
  kind: ReferenceKind,
  mandatory: boolean,
): Promise<ReferenceValidationResult> {
  const result = emptyReferenceResult();
  const trimmed = parseOptionalText(raw);
  if (!trimmed) return result;

  let resolved: string | number | null = null;
  switch (kind) {
    case "company_v1":
      resolved = await lookupCompanyV1Id(trimmed);
      break;
    case "legacy_company":
      resolved = await lookupLegacyCompanyId(trimmed);
      break;
    case "building":
      resolved = await lookupBuildingId(trimmed);
      break;
    case "contact":
      resolved = await lookupContactId(trimmed);
      break;
    case "opportunity":
      resolved = await lookupOpportunityId(trimmed);
      break;
    case "premises":
      resolved = await lookupPremisesId(trimmed);
      break;
    case "activity":
      resolved = await lookupActivityId(trimmed);
      break;
  }

  if (resolved != null) {
    if (String(resolved) !== trimmed) {
      result.writablePatches[field] = resolved;
    }
    return result;
  }

  if (mandatory) {
    result.errors.push(`${field} ${trimmed} not found`);
  } else {
    result.writablePatches[field] = null;
    result.warnings.push(optionalRelationshipWarning(field));
  }
  return result;
}

export async function resolveCompanyV1Reference(
  field: string,
  raw: unknown,
  mandatory: boolean,
): Promise<ReferenceValidationResult> {
  return resolveReference(field, raw, "company_v1", mandatory);
}

export async function resolveLegacyCompanyReference(
  field: string,
  raw: unknown,
  mandatory: boolean,
): Promise<ReferenceValidationResult> {
  return resolveReference(field, raw, "legacy_company", mandatory);
}

export async function resolveBuildingReference(
  field: string,
  raw: unknown,
  mandatory: boolean,
): Promise<ReferenceValidationResult> {
  return resolveReference(field, raw, "building", mandatory);
}

export async function resolveContactReference(
  field: string,
  raw: unknown,
  mandatory: boolean,
): Promise<ReferenceValidationResult> {
  return resolveReference(field, raw, "contact", mandatory);
}

export async function resolveOpportunityReference(
  field: string,
  raw: unknown,
  mandatory: boolean,
): Promise<ReferenceValidationResult> {
  return resolveReference(field, raw, "opportunity", mandatory);
}

export async function resolvePremisesReference(
  field: string,
  raw: unknown,
  mandatory: boolean,
): Promise<ReferenceValidationResult> {
  return resolveReference(field, raw, "premises", mandatory);
}

export async function resolveActivityReference(
  field: string,
  raw: unknown,
  mandatory: boolean,
): Promise<ReferenceValidationResult> {
  return resolveReference(field, raw, "activity", mandatory);
}
