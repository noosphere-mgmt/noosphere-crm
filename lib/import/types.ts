export type ImportObjectType =
  | "buildings"
  | "premises"
  | "companies"
  | "contacts"
  | "relationships"
  | "opportunities"
  | "opportunity_parties"
  | "opportunity_proposed_premises"
  | "activities"
  | "activity_premises";

export type RecordId = number | string;

export type ImportRowAction =
  | "create"
  | "update"
  | "clear_value"
  | "no_change"
  | "duplicate_candidate"
  | "error"
  | "skipped";

export type ImportFieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "enum"
  | "string_array";

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

export type FieldChange = {
  field: string;
  label: string;
  op: "set" | "clear";
  old_value: unknown;
  new_value: unknown;
};

export type ImportPreviewRow = {
  row_number: number;
  action: ImportRowAction;
  match_method: string | null;
  matched_id: number | null;
  matched_record_id: string | null;
  candidate_ids: number[] | null;
  candidate_record_ids: string[] | null;
  error_message: string | null;
  field_changes: FieldChange[] | null;
  changes_summary: string | null;
  raw_row: Record<string, string>;
};

export type ImportPreviewSummary = {
  create: number;
  update: number;
  clear_value: number;
  no_change: number;
  duplicate_candidate: number;
  error: number;
  skipped: number;
};

export type ExistingRecord = {
  id: RecordId;
  values: Record<string, unknown>;
};

export type ImportWriteContext = {
  importRunId?: number;
  sessionMetadata?: {
    source_system?: string | null;
    source_file?: string | null;
    source_date?: string | null;
  };
  existing?: ExistingRecord;
};

export const IMPORT_OBJECT_LABELS: Record<ImportObjectType, string> = {
  buildings: "Buildings",
  premises: "Premises",
  companies: "Companies",
  contacts: "Contacts",
  relationships: "Relationships",
  opportunities: "Opportunities",
  opportunity_parties: "Opportunity parties",
  opportunity_proposed_premises: "Opportunity proposed premises",
  activities: "Activities",
  activity_premises: "Activity premises checkpoints",
};

export const IMPORT_OBJECT_TYPES: ImportObjectType[] = [
  "buildings",
  "premises",
  "companies",
  "contacts",
  "relationships",
  "opportunities",
  "opportunity_parties",
  "opportunity_proposed_premises",
  "activities",
  "activity_premises",
];

/** @deprecated use IMPORT_OBJECT_TYPES */
export const IW1_OBJECT_TYPES = IMPORT_OBJECT_TYPES;
