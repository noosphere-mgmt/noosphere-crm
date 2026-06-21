import { buildCsvContent } from "@/lib/csvEncoding";
import { getImportRun, listImportRunRows, type ImportRun, type ImportRunRow } from "@/lib/repos/importRuns";
import { getImportSession } from "@/lib/repos/importSessions";

export type ImportRunDownloadKind = "upload" | "created" | "updated" | "errors";

export function buildImportRunDownloadFilename(run: ImportRun, kind: ImportRunDownloadKind): string {
  const base = run.filename.replace(/\.csv$/i, "") || `import-run-${run.id}`;
  const suffix =
    kind === "upload" ? "upload" : kind === "created" ? "created" : kind === "updated" ? "updated" : "errors";
  return `${base}-${suffix}-run${run.id}.csv`;
}

export async function buildImportRunDownloadCsv(
  importRunId: number,
  kind: ImportRunDownloadKind,
): Promise<{ csv: string; filename: string } | null> {
  const run = await getImportRun(importRunId);
  if (!run) return null;

  if (kind === "upload") {
    return buildUploadCsv(run);
  }

  const rows = await listImportRunRows(importRunId);
  const filtered = filterRowsByKind(rows, kind);
  if (filtered.length === 0) return null;

  const extraHeaders =
    kind === "errors"
      ? ["error_message"]
      : ["matched_record_id"];

  return rowsToCsv(filtered, extraHeaders, run, kind);
}

async function buildUploadCsv(run: ImportRun): Promise<{ csv: string; filename: string } | null> {
  if (run.session_id) {
    const session = await getImportSession(run.session_id);
    if (session?.csv_headers.length) {
      const dataRows = session.parsed_rows.map((row) =>
        session.csv_headers.map((header) => row[header] ?? ""),
      );
      return {
        csv: buildCsvContent(session.csv_headers, dataRows),
        filename: buildImportRunDownloadFilename(run, "upload"),
      };
    }
  }

  const rows = await listImportRunRows(run.id);
  const rawRows = rows.map((row) => row.raw_row).filter((row): row is Record<string, string> => row != null);
  if (rawRows.length === 0) return null;

  const headers = collectHeaders(rawRows);
  const dataRows = rawRows.map((row) => headers.map((header) => row[header] ?? ""));
  return {
    csv: buildCsvContent(headers, dataRows),
    filename: buildImportRunDownloadFilename(run, "upload"),
  };
}

function filterRowsByKind(rows: ImportRunRow[], kind: Exclude<ImportRunDownloadKind, "upload">): ImportRunRow[] {
  if (kind === "created") return rows.filter((row) => row.action === "create");
  if (kind === "updated") {
    return rows.filter((row) => row.action === "update" || row.action === "clear_value");
  }
  return rows.filter((row) => row.action === "error");
}

function rowsToCsv(
  rows: ImportRunRow[],
  extraHeaders: string[],
  run: ImportRun,
  kind: Exclude<ImportRunDownloadKind, "upload">,
): { csv: string; filename: string } {
  const rawRows = rows.map((row) => row.raw_row).filter((row): row is Record<string, string> => row != null);
  const headers = [...collectHeaders(rawRows)];
  for (const header of extraHeaders) {
    if (!headers.includes(header)) headers.push(header);
  }

  const dataRows = rows.map((row) =>
    headers.map((header) => {
      if (header === "error_message") return row.error_message ?? "";
      if (header === "matched_record_id") {
        return row.matched_record_id ?? (row.matched_id != null ? String(row.matched_id) : "");
      }
      return row.raw_row?.[header] ?? "";
    }),
  );

  return {
    csv: buildCsvContent(headers, dataRows),
    filename: buildImportRunDownloadFilename(run, kind),
  };
}

function collectHeaders(rawRows: Record<string, string>[]): string[] {
  const seen = new Set<string>();
  const headers: string[] = [];
  for (const row of rawRows) {
    for (const key of Object.keys(row)) {
      if (seen.has(key)) continue;
      seen.add(key);
      headers.push(key);
    }
  }
  return headers;
}
