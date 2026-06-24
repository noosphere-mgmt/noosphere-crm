import type { ImportObjectType } from "@/lib/import/types";

export type ExportScope = "all" | "selected" | "filtered";

const EXPORT_FILE_PREFIX: Record<ImportObjectType, string> = {
  buildings: "buildings",
  premises: "premises",
  companies: "companies",
  contacts: "contacts",
  opportunities: "opportunities",
  activities: "activities",
  relationships: "relationships",
  opportunity_parties: "opp_parties",
  opportunity_proposed_premises: "opp_premises",
  activity_premises: "activity_premises",
};

/** UTC calendar date as YYYYMMDD (matches export download naming). */
export function exportDateYmd(date = new Date()): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

export function buildExportFilename(objectType: string, date = new Date()): string {
  const prefix = EXPORT_FILE_PREFIX[objectType as ImportObjectType] ?? objectType;
  return `${prefix}_${exportDateYmd(date)}.csv`;
}
