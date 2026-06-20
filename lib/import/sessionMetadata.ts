/** Default import session metadata when the user does not override Advanced fields. */
export const IMPORT_SOURCE_SYSTEM_DEFAULT = "manual_import";

export type ImportSessionMetadataInput = {
  source_system?: string | null;
  source_file?: string | null;
  source_date?: string | null;
  filename: string;
};

export function todayImportDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Resolve metadata for a new upload — never returns empty required fields. */
export function resolveImportSessionMetadata(input: ImportSessionMetadataInput): {
  source_system: string;
  source_file: string;
  source_date: string;
} {
  const source_system =
    input.source_system?.trim() || IMPORT_SOURCE_SYSTEM_DEFAULT;
  const source_file = input.source_file?.trim() || input.filename.trim() || "upload.csv";
  const source_date = input.source_date?.trim() || todayImportDate();
  return { source_system, source_file, source_date };
}
