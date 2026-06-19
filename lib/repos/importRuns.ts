import { query } from "@/lib/db";
import type { ImportObjectType, ImportPreviewRow, ImportPreviewSummary } from "@/lib/import/types";

export type ImportRun = {
  id: number;
  session_id: string | null;
  import_date: string;
  object_type: ImportObjectType;
  filename: string;
  uploaded_by: string;
  source_system: string | null;
  source_file: string | null;
  source_date: string | null;
  created_count: number;
  updated_count: number;
  cleared_count: number;
  skipped_count: number;
  error_count: number;
  duplicate_count: number;
  column_mapping: Record<string, string>;
  summary: ImportPreviewSummary | null;
};

export async function createImportRun(input: {
  sessionId: string | null;
  objectType: ImportObjectType;
  filename: string;
  uploadedBy: string;
  sourceSystem?: string | null;
  sourceFile?: string | null;
  sourceDate?: string | null;
  columnMapping: Record<string, string>;
  summary: ImportPreviewSummary;
}): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO import_runs (
       session_id, object_type, filename, uploaded_by,
       source_system, source_file, source_date,
       created_count, updated_count, cleared_count, skipped_count,
       error_count, duplicate_count, column_mapping, summary
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING id::text`,
    [
      input.sessionId,
      input.objectType,
      input.filename,
      input.uploadedBy,
      input.sourceSystem ?? null,
      input.sourceFile ?? null,
      input.sourceDate ?? null,
      input.summary.create,
      input.summary.update + input.summary.clear_value,
      input.summary.clear_value,
      input.summary.skipped + input.summary.no_change,
      input.summary.error,
      input.summary.duplicate_candidate,
      JSON.stringify(input.columnMapping),
      JSON.stringify(input.summary),
    ],
  );
  return Number.parseInt(rows[0]!.id, 10);
}

export async function updateImportRunCounts(
  importRunId: number,
  summary: ImportPreviewSummary,
): Promise<void> {
  await query(
    `UPDATE import_runs SET
       created_count = $2, updated_count = $3, cleared_count = $4,
       skipped_count = $5, error_count = $6, duplicate_count = $7, summary = $8
     WHERE id = $1`,
    [
      importRunId,
      summary.create,
      summary.update + summary.clear_value,
      summary.clear_value,
      summary.skipped + summary.no_change,
      summary.error,
      summary.duplicate_candidate,
      JSON.stringify(summary),
    ],
  );
}

export async function insertImportRunRows(
  importRunId: number,
  rows: ImportPreviewRow[],
): Promise<void> {
  for (const row of rows) {
    await query(
      `INSERT INTO import_run_rows (
         import_run_id, row_number, action, match_method, matched_id, matched_record_id,
         candidate_ids, error_message, field_changes, raw_row
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        importRunId,
        row.row_number,
        row.action,
        row.match_method,
        row.matched_id,
        row.matched_record_id,
        row.candidate_ids,
        row.error_message,
        row.field_changes ? JSON.stringify(row.field_changes) : null,
        JSON.stringify(row.raw_row),
      ],
    );
  }
}

export async function listImportRuns(limit = 50): Promise<ImportRun[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, session_id, import_date::text AS import_date, object_type, filename,
            uploaded_by, source_system, source_file, source_date::text AS source_date,
            created_count, updated_count, cleared_count, skipped_count,
            error_count, duplicate_count, column_mapping, summary
     FROM import_runs ORDER BY import_date DESC LIMIT $1`,
    [limit],
  );
  return rows.map(mapRun);
}

export async function getImportRun(id: number): Promise<ImportRun | null> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, session_id, import_date::text AS import_date, object_type, filename,
            uploaded_by, source_system, source_file, source_date::text AS source_date,
            created_count, updated_count, cleared_count, skipped_count,
            error_count, duplicate_count, column_mapping, summary
     FROM import_runs WHERE id = $1`,
    [id],
  );
  return rows[0] ? mapRun(rows[0]) : null;
}

export async function listImportRunRows(importRunId: number) {
  return query<{
    row_number: number;
    action: string;
    match_method: string | null;
    matched_id: number | null;
    candidate_ids: number[] | null;
    error_message: string | null;
    field_changes: unknown;
  }>(
    `SELECT row_number, action, match_method, matched_id, candidate_ids,
            error_message, field_changes
     FROM import_run_rows WHERE import_run_id = $1 ORDER BY row_number`,
    [importRunId],
  );
}

function mapRun(row: Record<string, unknown>): ImportRun {
  return {
    id: Number(row.id),
    session_id: row.session_id != null ? String(row.session_id) : null,
    import_date: String(row.import_date),
    object_type: row.object_type as ImportObjectType,
    filename: String(row.filename),
    uploaded_by: String(row.uploaded_by),
    source_system: row.source_system != null ? String(row.source_system) : null,
    source_file: row.source_file != null ? String(row.source_file) : null,
    source_date: row.source_date != null ? String(row.source_date).slice(0, 10) : null,
    created_count: Number(row.created_count),
    updated_count: Number(row.updated_count),
    cleared_count: Number(row.cleared_count),
    skipped_count: Number(row.skipped_count),
    error_count: Number(row.error_count),
    duplicate_count: Number(row.duplicate_count),
    column_mapping: row.column_mapping as Record<string, string>,
    summary: row.summary as ImportPreviewSummary | null,
  };
}
