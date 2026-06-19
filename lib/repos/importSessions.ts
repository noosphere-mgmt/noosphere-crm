import { query } from "@/lib/db";
import type { ImportObjectType, ImportPreviewRow, ImportPreviewSummary } from "@/lib/import/types";

export type ImportSession = {
  id: string;
  object_type: ImportObjectType;
  filename: string;
  uploaded_by: string;
  source_system: string | null;
  source_file: string | null;
  source_date: string | null;
  status: "mapping" | "previewed" | "committed" | "cancelled";
  csv_headers: string[];
  column_mapping: Record<string, string>;
  row_count: number;
  parsed_rows: Record<string, string>[];
  preview_summary: ImportPreviewSummary | null;
  preview_rows: ImportPreviewRow[] | null;
  import_run_id: number | null;
  created_at: string;
};

export type CreateSessionInput = {
  id: string;
  object_type: ImportObjectType;
  filename: string;
  uploaded_by: string;
  source_system?: string | null;
  source_file?: string | null;
  source_date?: string | null;
  csv_headers: string[];
  column_mapping: Record<string, string>;
  parsed_rows: Record<string, string>[];
};

function mapSession(row: Record<string, unknown>): ImportSession {
  return {
    id: String(row.id),
    object_type: row.object_type as ImportObjectType,
    filename: String(row.filename),
    uploaded_by: String(row.uploaded_by),
    source_system: row.source_system != null ? String(row.source_system) : null,
    source_file: row.source_file != null ? String(row.source_file) : null,
    source_date: row.source_date != null ? String(row.source_date).slice(0, 10) : null,
    status: row.status as ImportSession["status"],
    csv_headers: row.csv_headers as string[],
    column_mapping: row.column_mapping as Record<string, string>,
    row_count: Number(row.row_count),
    parsed_rows: row.parsed_rows as Record<string, string>[],
    preview_summary: row.preview_summary as ImportPreviewSummary | null,
    preview_rows: row.preview_rows as ImportPreviewRow[] | null,
    import_run_id: row.import_run_id != null ? Number(row.import_run_id) : null,
    created_at: String(row.created_at),
  };
}

export async function createImportSession(input: CreateSessionInput): Promise<void> {
  await query(
    `INSERT INTO import_sessions (
       id, object_type, filename, uploaded_by, source_system, source_file, source_date,
       csv_headers, column_mapping, row_count, parsed_rows
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      input.id,
      input.object_type,
      input.filename,
      input.uploaded_by,
      input.source_system ?? null,
      input.source_file ?? null,
      input.source_date ?? null,
      JSON.stringify(input.csv_headers),
      JSON.stringify(input.column_mapping),
      input.parsed_rows.length,
      JSON.stringify(input.parsed_rows),
    ],
  );
}

export async function getImportSession(id: string): Promise<ImportSession | null> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, object_type, filename, uploaded_by,
            source_system, source_file, source_date::text AS source_date,
            status, csv_headers, column_mapping, row_count, parsed_rows,
            preview_summary, preview_rows, import_run_id, created_at::text AS created_at
     FROM import_sessions WHERE id = $1`,
    [id],
  );
  return rows[0] ? mapSession(rows[0]) : null;
}

export async function updateSessionMapping(
  id: string,
  columnMapping: Record<string, string>,
): Promise<void> {
  await query(
    `UPDATE import_sessions SET column_mapping = $2, status = 'mapping' WHERE id = $1`,
    [id, JSON.stringify(columnMapping)],
  );
}

export async function saveSessionPreview(
  id: string,
  summary: ImportPreviewSummary,
  rows: ImportPreviewRow[],
): Promise<void> {
  const capped = rows.slice(0, 500);
  await query(
    `UPDATE import_sessions SET
       preview_summary = $2, preview_rows = $3, status = 'previewed'
     WHERE id = $1`,
    [id, JSON.stringify(summary), JSON.stringify(capped)],
  );
}

export async function markSessionCommitted(id: string, importRunId: number): Promise<void> {
  await query(
    `UPDATE import_sessions SET status = 'committed', import_run_id = $2 WHERE id = $1`,
    [id, importRunId],
  );
}
