import { query } from "@/lib/db";
import { loadCompanyLookupMaps } from "@/lib/companyV1Resolve";
import { resolveToV1CompanyId } from "@/lib/companyIdResolve";
import { sqlContactDisplayName } from "@/lib/contactName";
import { sqlActivityLabel, sqlPremisesLabel } from "./lookupSql";
import type { ExistingRecord } from "./types";
import {
  activityExists,
  buildingExists,
  companyExists,
  contactExists,
  opportunityExists,
  parseOptionalInt,
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

async function lookupLegacyCompanyIdByName(name: string): Promise<number | null> {
  const rows = await query<{ id: string }>(
    `SELECT id::text FROM companies
     WHERE lower(trim(company_name)) = $1
     ORDER BY id ASC`,
    [name.trim().toLowerCase()],
  );
  if (rows.length === 1) return Number.parseInt(rows[0]!.id, 10);
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

async function lookupBuildingIdByName(name: string): Promise<string | null> {
  const rows = await query<{ property_id: string }>(
    `SELECT property_id FROM properties_v1
     WHERE lower(trim(bldg_name_en)) = $1
     ORDER BY property_id ASC`,
    [name.trim().toLowerCase()],
  );
  if (rows.length === 1) return rows[0]!.property_id;
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

async function lookupContactIdByDisplayName(
  name: string,
  companyId?: number | null,
): Promise<number | null> {
  const params: unknown[] = [name.trim().toLowerCase()];
  let companyClause = "";
  if (companyId != null) {
    companyClause = " AND company_id = $2";
    params.push(companyId);
  }
  const rows = await query<{ id: string }>(
    `SELECT id::text FROM contacts
     WHERE lower(trim(${sqlContactDisplayName()})) = $1${companyClause}
     ORDER BY id ASC`,
    params,
  );
  if (rows.length === 1) return Number.parseInt(rows[0]!.id, 10);
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

async function lookupOpportunityIdByName(name: string, companyId?: number | null): Promise<number | null> {
  const params: unknown[] = [name.trim().toLowerCase()];
  let companyClause = "";
  if (companyId != null) {
    companyClause = " AND company_id = $2";
    params.push(companyId);
  }
  const rows = await query<{ id: string }>(
    `SELECT id::text FROM opportunities
     WHERE lower(trim(client_name)) = $1${companyClause}
     ORDER BY id ASC`,
    params,
  );
  if (rows.length === 1) return Number.parseInt(rows[0]!.id, 10);
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

async function lookupPremisesIdByName(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (await premisesExists(trimmed)) return trimmed;

  const byOffice = await query<{ premises_id: string }>(
    `SELECT premises_id FROM premises_v1
     WHERE lower(trim(office_name)) = $1
     ORDER BY premises_id ASC`,
    [trimmed.toLowerCase()],
  );
  if (byOffice.length === 1) return byOffice[0]!.premises_id;

  const byLabel = await query<{ premises_id: string }>(
    `SELECT pm.premises_id
     FROM premises_v1 pm
     LEFT JOIN properties_v1 b ON b.property_id = pm.property_id
     WHERE lower(trim(${sqlPremisesLabel("pm", "b")})) = $1
     ORDER BY pm.premises_id ASC`,
    [trimmed.toLowerCase()],
  );
  if (byLabel.length === 1) return byLabel[0]!.premises_id;
  return null;
}

async function lookupActivityId(raw: string): Promise<string | null> {
  if (await activityExists(raw)) return raw;
  return null;
}

async function lookupActivityIdByName(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (await activityExists(trimmed)) return trimmed;

  const rows = await query<{ activity_id: string }>(
    `SELECT a.activity_id FROM activities a
     WHERE lower(trim(${sqlActivityLabel("a")})) = $1
     ORDER BY a.activity_id ASC`,
    [trimmed.toLowerCase()],
  );
  if (rows.length === 1) return rows[0]!.activity_id;
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
    result.writablePatches[field] = resolved;
    return result;
  }

  if (mandatory) {
    if (kind === "legacy_company" && trimmed && parseOptionalInt(trimmed) == null) {
      result.errors.push(
        `${field} "${trimmed}" is not a valid company ID — use numeric id or external_ref (names belong in display_name / chinese_name, not company_id)`,
      );
    } else {
      result.errors.push(`${field} ${trimmed} not found`);
    }
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

function fieldSupplied(
  key: string,
  suppliedFields: Set<string>,
  writable: Record<string, unknown>,
): boolean {
  return suppliedFields.has(key) || key in writable;
}

function pickRaw(
  key: string,
  values: Record<string, unknown>,
  suppliedFields: Set<string>,
  existing: ExistingRecord | null,
  writable: Record<string, unknown>,
): unknown {
  if (suppliedFields.has(key)) return values[key];
  if (key in writable) return writable[key];
  return existing?.values[key];
}

/** Prefer numeric/external_ref ID; fall back to name lookup when ID blank. */
export async function resolveLegacyCompanyIdOrName(
  idField: string,
  nameField: string,
  values: Record<string, unknown>,
  suppliedFields: Set<string>,
  existing: ExistingRecord | null,
  writable: Record<string, unknown>,
  mandatory: boolean,
): Promise<ReferenceValidationResult> {
  const hasId = fieldSupplied(idField, suppliedFields, writable);
  const hasName = suppliedFields.has(nameField);
  if (!hasId && !hasName) {
    if (mandatory && !existing) {
      const result = emptyReferenceResult();
      result.errors.push(`${idField} or ${nameField} is required`);
      return result;
    }
    return emptyReferenceResult();
  }

  const idRaw = pickRaw(idField, values, suppliedFields, existing, writable);
  const nameRaw = suppliedFields.has(nameField) ? values[nameField] : undefined;
  const idTrimmed = parseOptionalText(idRaw);
  const nameTrimmed = parseOptionalText(nameRaw);

  if (idTrimmed) {
    const byId = await resolveLegacyCompanyReference(idField, idTrimmed, mandatory);
    if (byId.errors.length > 0) return byId;
    if (nameTrimmed) {
      const byName = await lookupLegacyCompanyIdByName(nameTrimmed);
      const resolvedId = byId.writablePatches[idField];
      if (byName != null && resolvedId != null && byName !== resolvedId) {
        byId.warnings.push(`${nameField} "${nameTrimmed}" does not match ${idField} ${resolvedId}`);
      }
    }
    return byId;
  }

  if (nameTrimmed) {
    const byName = await lookupLegacyCompanyIdByName(nameTrimmed);
    if (byName != null) {
      const result = emptyReferenceResult();
      result.writablePatches[idField] = byName;
      return result;
    }
    const result = emptyReferenceResult();
    if (mandatory) {
      result.errors.push(`${nameField} "${nameTrimmed}" not found`);
    } else {
      result.writablePatches[idField] = null;
      result.warnings.push(optionalRelationshipWarning(nameField));
    }
    return result;
  }

  if (mandatory) {
    const result = emptyReferenceResult();
    result.errors.push(`${idField} or ${nameField} is required`);
    return result;
  }
  return emptyReferenceResult();
}

/** Prefer v1 company ID; fall back to company_name_en lookup when ID blank. */
export async function resolveCompanyV1IdOrName(
  idField: string,
  nameField: string,
  values: Record<string, unknown>,
  suppliedFields: Set<string>,
  existing: ExistingRecord | null,
  writable: Record<string, unknown>,
  mandatory: boolean,
): Promise<ReferenceValidationResult> {
  const hasId = fieldSupplied(idField, suppliedFields, writable);
  const hasName = suppliedFields.has(nameField);
  if (!hasId && !hasName) return emptyReferenceResult();

  const idRaw = pickRaw(idField, values, suppliedFields, existing, writable);
  const nameRaw = suppliedFields.has(nameField) ? values[nameField] : undefined;
  const idTrimmed = parseOptionalText(idRaw);
  const nameTrimmed = parseOptionalText(nameRaw);

  if (idTrimmed) {
    const byId = await resolveCompanyV1Reference(idField, idTrimmed, mandatory);
    if (byId.errors.length > 0) return byId;
    if (nameTrimmed) {
      const maps = await loadCompanyLookupMaps();
      const nameId = resolveToV1CompanyId(nameTrimmed, maps);
      const resolvedId = byId.writablePatches[idField];
      if (nameId && resolvedId && nameId !== resolvedId) {
        byId.warnings.push(`${nameField} "${nameTrimmed}" does not match ${idField} ${resolvedId}`);
      }
    }
    return byId;
  }

  if (nameTrimmed) {
    const maps = await loadCompanyLookupMaps();
    const byName = resolveToV1CompanyId(nameTrimmed, maps);
    if (byName) {
      const result = emptyReferenceResult();
      result.writablePatches[idField] = byName;
      return result;
    }
    const result = emptyReferenceResult();
    if (mandatory) {
      result.errors.push(`${nameField} "${nameTrimmed}" not found`);
    } else {
      result.writablePatches[idField] = null;
      result.warnings.push(optionalRelationshipWarning(nameField));
    }
    return result;
  }

  return emptyReferenceResult();
}

/** Prefer building_id; fall back to building_name_en lookup when ID blank. */
export async function resolveBuildingIdOrName(
  idField: string,
  nameField: string,
  values: Record<string, unknown>,
  suppliedFields: Set<string>,
  existing: ExistingRecord | null,
  writable: Record<string, unknown>,
  mandatory: boolean,
): Promise<ReferenceValidationResult> {
  const hasId = fieldSupplied(idField, suppliedFields, writable);
  const hasName = suppliedFields.has(nameField);
  if (!hasId && !hasName) {
    if (mandatory && !existing) {
      const result = emptyReferenceResult();
      result.errors.push(`${idField} or ${nameField} is required`);
      return result;
    }
    return emptyReferenceResult();
  }

  const idRaw = pickRaw(idField, values, suppliedFields, existing, writable);
  const nameRaw = suppliedFields.has(nameField) ? values[nameField] : undefined;
  const idTrimmed = parseOptionalText(idRaw);
  const nameTrimmed = parseOptionalText(nameRaw);

  if (idTrimmed) {
    const byId = await resolveBuildingReference(idField, idTrimmed, mandatory);
    if (byId.errors.length > 0) return byId;
    if (nameTrimmed) {
      const byName = await lookupBuildingIdByName(nameTrimmed);
      const resolvedId = byId.writablePatches[idField];
      if (byName && resolvedId && byName !== resolvedId) {
        byId.warnings.push(`${nameField} "${nameTrimmed}" does not match ${idField} ${resolvedId}`);
      }
    }
    return byId;
  }

  if (nameTrimmed) {
    const byName = await lookupBuildingIdByName(nameTrimmed);
    if (byName) {
      const result = emptyReferenceResult();
      result.writablePatches[idField] = byName;
      return result;
    }
    const result = emptyReferenceResult();
    if (mandatory) {
      result.errors.push(`${nameField} "${nameTrimmed}" not found`);
    } else {
      result.writablePatches[idField] = null;
      result.warnings.push(optionalRelationshipWarning(nameField));
    }
    return result;
  }

  if (mandatory) {
    const result = emptyReferenceResult();
    result.errors.push(`${idField} or ${nameField} is required`);
    return result;
  }
  return emptyReferenceResult();
}

/** Prefer contact ID; fall back to display name lookup when ID blank. */
export async function resolveContactIdOrName(
  idField: string,
  nameField: string,
  values: Record<string, unknown>,
  suppliedFields: Set<string>,
  existing: ExistingRecord | null,
  writable: Record<string, unknown>,
  mandatory: boolean,
  scopeCompanyId?: number | null,
): Promise<ReferenceValidationResult> {
  const hasId = fieldSupplied(idField, suppliedFields, writable);
  const hasName = suppliedFields.has(nameField);
  if (!hasId && !hasName) return emptyReferenceResult();

  const idRaw = pickRaw(idField, values, suppliedFields, existing, writable);
  const nameRaw = suppliedFields.has(nameField) ? values[nameField] : undefined;
  const idTrimmed = parseOptionalText(idRaw);
  const nameTrimmed = parseOptionalText(nameRaw);
  const companyScope =
    scopeCompanyId ??
    parseOptionalInt(pickRaw("company_id", values, suppliedFields, existing, writable));

  if (idTrimmed) {
    const byId = await resolveContactReference(idField, idTrimmed, mandatory);
    if (byId.errors.length > 0) return byId;
    if (nameTrimmed) {
      const byName = await lookupContactIdByDisplayName(nameTrimmed, companyScope);
      const resolvedId = byId.writablePatches[idField];
      if (byName != null && resolvedId != null && byName !== resolvedId) {
        byId.warnings.push(`${nameField} "${nameTrimmed}" does not match ${idField} ${resolvedId}`);
      }
    }
    return byId;
  }

  if (nameTrimmed) {
    const byName = await lookupContactIdByDisplayName(nameTrimmed, companyScope);
    if (byName != null) {
      const result = emptyReferenceResult();
      result.writablePatches[idField] = byName;
      return result;
    }
    const result = emptyReferenceResult();
    if (mandatory) {
      result.errors.push(`${nameField} "${nameTrimmed}" not found`);
    } else {
      result.writablePatches[idField] = null;
      result.warnings.push(optionalRelationshipWarning(nameField));
    }
    return result;
  }

  return emptyReferenceResult();
}

/** Prefer opportunity ID; fall back to opportunity_name lookup when ID blank. */
export async function resolveOpportunityIdOrName(
  idField: string,
  nameField: string,
  values: Record<string, unknown>,
  suppliedFields: Set<string>,
  existing: ExistingRecord | null,
  writable: Record<string, unknown>,
  mandatory: boolean,
  scopeCompanyId?: number | null,
): Promise<ReferenceValidationResult> {
  const hasId = fieldSupplied(idField, suppliedFields, writable);
  const hasName = suppliedFields.has(nameField);
  if (!hasId && !hasName) return emptyReferenceResult();

  const idRaw = pickRaw(idField, values, suppliedFields, existing, writable);
  const nameRaw = suppliedFields.has(nameField) ? values[nameField] : undefined;
  const idTrimmed = parseOptionalText(idRaw);
  const nameTrimmed = parseOptionalText(nameRaw);
  const companyScope =
    scopeCompanyId ??
    parseOptionalInt(pickRaw("company_id", values, suppliedFields, existing, writable));

  if (idTrimmed) {
    const byId = await resolveOpportunityReference(idField, idTrimmed, mandatory);
    if (byId.errors.length > 0) return byId;
    if (nameTrimmed) {
      const byName = await lookupOpportunityIdByName(nameTrimmed, companyScope);
      const resolvedId = byId.writablePatches[idField];
      if (byName != null && resolvedId != null && byName !== resolvedId) {
        byId.warnings.push(`${nameField} "${nameTrimmed}" does not match ${idField} ${resolvedId}`);
      }
    }
    return byId;
  }

  return emptyReferenceResult();
}

/** Prefer premises_id; fall back to premises_name lookup when ID blank. */
export async function resolvePremisesIdOrName(
  idField: string,
  nameField: string,
  values: Record<string, unknown>,
  suppliedFields: Set<string>,
  existing: ExistingRecord | null,
  writable: Record<string, unknown>,
  mandatory: boolean,
): Promise<ReferenceValidationResult> {
  const hasId = fieldSupplied(idField, suppliedFields, writable);
  const hasName = suppliedFields.has(nameField);
  if (!hasId && !hasName) {
    if (mandatory && !existing) {
      const result = emptyReferenceResult();
      result.errors.push(`${idField} or ${nameField} is required`);
      return result;
    }
    return emptyReferenceResult();
  }

  const idRaw = pickRaw(idField, values, suppliedFields, existing, writable);
  const nameRaw = suppliedFields.has(nameField) ? values[nameField] : undefined;
  const idTrimmed = parseOptionalText(idRaw);
  const nameTrimmed = parseOptionalText(nameRaw);

  if (idTrimmed) {
    const byId = await resolvePremisesReference(idField, idTrimmed, mandatory);
    if (byId.errors.length > 0) return byId;
    if (nameTrimmed) {
      const byName = await lookupPremisesIdByName(nameTrimmed);
      const resolvedId = byId.writablePatches[idField];
      if (byName && resolvedId && byName !== resolvedId) {
        byId.warnings.push(`${nameField} "${nameTrimmed}" does not match ${idField} ${resolvedId}`);
      }
    }
    return byId;
  }

  if (nameTrimmed) {
    const byName = await lookupPremisesIdByName(nameTrimmed);
    if (byName) {
      const result = emptyReferenceResult();
      result.writablePatches[idField] = byName;
      return result;
    }
    const result = emptyReferenceResult();
    if (mandatory) {
      result.errors.push(`${nameField} "${nameTrimmed}" not found`);
    } else {
      result.writablePatches[idField] = null;
      result.warnings.push(optionalRelationshipWarning(nameField));
    }
    return result;
  }

  if (mandatory) {
    const result = emptyReferenceResult();
    result.errors.push(`${idField} or ${nameField} is required`);
    return result;
  }
  return emptyReferenceResult();
}

/** Prefer activity_id; fall back to activity_name lookup when ID blank. */
export async function resolveActivityIdOrName(
  idField: string,
  nameField: string,
  values: Record<string, unknown>,
  suppliedFields: Set<string>,
  existing: ExistingRecord | null,
  writable: Record<string, unknown>,
  mandatory: boolean,
): Promise<ReferenceValidationResult> {
  const hasId = fieldSupplied(idField, suppliedFields, writable);
  const hasName = suppliedFields.has(nameField);
  if (!hasId && !hasName) {
    if (mandatory && !existing) {
      const result = emptyReferenceResult();
      result.errors.push(`${idField} or ${nameField} is required`);
      return result;
    }
    return emptyReferenceResult();
  }

  const idRaw = pickRaw(idField, values, suppliedFields, existing, writable);
  const nameRaw = suppliedFields.has(nameField) ? values[nameField] : undefined;
  const idTrimmed = parseOptionalText(idRaw);
  const nameTrimmed = parseOptionalText(nameRaw);

  if (idTrimmed) {
    const byId = await resolveActivityReference(idField, idTrimmed, mandatory);
    if (byId.errors.length > 0) return byId;
    if (nameTrimmed) {
      const byName = await lookupActivityIdByName(nameTrimmed);
      const resolvedId = byId.writablePatches[idField];
      if (byName && resolvedId && byName !== resolvedId) {
        byId.warnings.push(`${nameField} "${nameTrimmed}" does not match ${idField} ${resolvedId}`);
      }
    }
    return byId;
  }

  if (nameTrimmed) {
    const byName = await lookupActivityIdByName(nameTrimmed);
    if (byName) {
      const result = emptyReferenceResult();
      result.writablePatches[idField] = byName;
      return result;
    }
    const result = emptyReferenceResult();
    if (mandatory) {
      result.errors.push(`${nameField} "${nameTrimmed}" not found`);
    } else {
      result.writablePatches[idField] = null;
      result.warnings.push(optionalRelationshipWarning(nameField));
    }
    return result;
  }

  if (mandatory) {
    const result = emptyReferenceResult();
    result.errors.push(`${idField} or ${nameField} is required`);
    return result;
  }
  return emptyReferenceResult();
}

/** Resolve polymorphic relationship endpoint by entity type. */
export async function resolveRelationshipEntityIdOrName(
  idField: string,
  nameField: string,
  typeField: string,
  values: Record<string, unknown>,
  suppliedFields: Set<string>,
  existing: ExistingRecord | null,
  writable: Record<string, unknown>,
  mandatory: boolean,
): Promise<ReferenceValidationResult> {
  const entityType = String(
    pickRaw(typeField, values, suppliedFields, existing, writable) ?? "",
  )
    .trim()
    .toLowerCase();

  if (entityType === "company") {
    const result = await resolveLegacyCompanyIdOrName(
      idField,
      nameField,
      values,
      suppliedFields,
      existing,
      writable,
      mandatory,
    );
    if (result.writablePatches[idField] != null) {
      result.writablePatches[idField] = String(result.writablePatches[idField]);
    }
    return result;
  }
  if (entityType === "contact") {
    const result = await resolveContactIdOrName(
      idField,
      nameField,
      values,
      suppliedFields,
      existing,
      writable,
      mandatory,
    );
    if (result.writablePatches[idField] != null) {
      result.writablePatches[idField] = String(result.writablePatches[idField]);
    }
    return result;
  }

  if (mandatory && (fieldSupplied(idField, suppliedFields, writable) || suppliedFields.has(nameField))) {
    const err = emptyReferenceResult();
    err.errors.push(`${typeField} must be company or contact`);
    return err;
  }
  return emptyReferenceResult();
}
