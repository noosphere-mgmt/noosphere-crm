import { buildingsImportDefinition } from "./adapters/buildings";
import { companiesImportDefinition } from "./adapters/companies";
import { contactsImportDefinition } from "./adapters/contacts";
import { premisesImportDefinition } from "./adapters/premises";
import { relationshipsImportDefinition } from "./adapters/relationships";
import { opportunitiesImportDefinition } from "./adapters/opportunities";
import { opportunityPartiesImportDefinition } from "./adapters/opportunityParties";
import { opportunityProposedPremisesImportDefinition } from "./adapters/opportunityProposedPremises";
import { activitiesImportDefinition } from "./adapters/activities";
import { activityPremisesImportDefinition } from "./adapters/activityPremises";
import type { ImportObjectType, ExistingRecord, ImportWriteContext, RecordId } from "./types";

export type ImportFieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "enum"
  | "string_array"
  | "company_roles";

export type ImportFieldDef = {
  key: string;
  label: string;
  type: ImportFieldType;
  aliases?: string[];
  requiredOnCreate?: boolean;
  defaultValue?: unknown;
  integer?: boolean;
  enumValues?: string[];
  /** Match priority A — not written on create/update */
  matchOnly?: boolean;
  /** Omit from export template */
  exportHidden?: boolean;
};

export type ImportObjectDefinition = {
  objectType: ImportObjectType;
  tableName: string;
  /** CSV / match field for internal ID (default "id") */
  matchIdField: string;
  idType: "number" | "text";
  fields: ImportFieldDef[];
  findById: (id: RecordId) => Promise<ExistingRecord | null>;
  findByExternalRef: (externalRef: string) => Promise<ExistingRecord[]>;
  buildNaturalKey: (values: Record<string, unknown>) => { ok: boolean; key: string };
  findByNaturalKey: (key: string) => Promise<ExistingRecord[]>;
  createRecord: (values: Record<string, unknown>, ctx: ImportWriteContext) => Promise<RecordId>;
  updateRecord: (
    id: RecordId,
    patch: Record<string, unknown>,
    ctx: ImportWriteContext,
  ) => Promise<void>;
  /** Cross-table FK validation before patch apply */
  validateReferences?: (
    values: Record<string, unknown>,
    suppliedFields: Set<string>,
    existing: ExistingRecord | null,
  ) => Promise<string[]>;
  /** Export all rows as CSV field values keyed by import field keys */
  exportRows?: () => Promise<Record<string, unknown>[]>;
};

const registry: Partial<Record<ImportObjectType, ImportObjectDefinition>> = {
  buildings: buildingsImportDefinition,
  premises: premisesImportDefinition,
  companies: companiesImportDefinition,
  contacts: contactsImportDefinition,
  relationships: relationshipsImportDefinition,
  opportunities: opportunitiesImportDefinition,
  opportunity_parties: opportunityPartiesImportDefinition,
  opportunity_proposed_premises: opportunityProposedPremisesImportDefinition,
  activities: activitiesImportDefinition,
  activity_premises: activityPremisesImportDefinition,
};

export function listMappingFieldOptions(objectType: ImportObjectType) {
  return listAllImportFields(objectType).map((f) => ({
    key: f.key,
    label: f.label,
    matchOnly: f.matchOnly ?? false,
  }));
}

export function getImportObjectDefinition(objectType: ImportObjectType): ImportObjectDefinition {
  const def = registry[objectType];
  if (!def) {
    throw new Error(`Import not implemented for object type: ${objectType}`);
  }
  return def;
}

export function listImportFields(objectType: ImportObjectType): ImportFieldDef[] {
  return getImportObjectDefinition(objectType).fields.filter((f) => !f.matchOnly);
}

export function listAllImportFields(objectType: ImportObjectType): ImportFieldDef[] {
  return getImportObjectDefinition(objectType).fields;
}

export function listExportFields(objectType: ImportObjectType): ImportFieldDef[] {
  return listAllImportFields(objectType).filter((f) => !f.exportHidden);
}

export function isImportEnabled(objectType: ImportObjectType): boolean {
  return objectType in registry;
}

export function resolveMatchIdValue(
  def: ImportObjectDefinition,
  values: Record<string, unknown>,
): unknown {
  return values[def.matchIdField] ?? values.id;
}
