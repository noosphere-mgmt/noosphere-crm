import type {
  FieldChange,
  ImportObjectType,
  ImportPreviewRow,
  ImportRowAction,
  ParsedCsv,
} from "./types";
import type { ImportObjectDefinition } from "./objectRegistry";
import { getImportObjectDefinition } from "./objectRegistry";
import { applyColumnMapping } from "./mapping";
import { candidateIdsToPreview, matchRecord, recordIdToPreview } from "./matchRecord";
import { computePatch } from "./patchSemantics";

export type ImportEngineOptions = {
  objectType: ImportObjectType;
  parsed: ParsedCsv;
  columnMapping: Record<string, string>;
  mode: "dry_run" | "commit";
  importRunId?: number;
  sessionMetadata?: {
    source_system?: string | null;
    source_file?: string | null;
    source_date?: string | null;
  };
  skipErrors?: boolean;
};

export type ImportEngineResult = {
  summary: {
    create: number;
    update: number;
    clear_value: number;
    no_change: number;
    duplicate_candidate: number;
    error: number;
    skipped: number;
  };
  rows: ImportPreviewRow[];
};

export async function runImportEngine(opts: ImportEngineOptions): Promise<ImportEngineResult> {
  const def = getImportObjectDefinition(opts.objectType);
  const summary = {
    create: 0,
    update: 0,
    clear_value: 0,
    no_change: 0,
    duplicate_candidate: 0,
    error: 0,
    skipped: 0,
  };
  const rows: ImportPreviewRow[] = [];

  for (let i = 0; i < opts.parsed.rows.length; i++) {
    const rowNumber = i + 1;
    const rawRow = opts.parsed.rows[i]!;
    const previewRow = await processRow(def, opts, rowNumber, rawRow);
    rows.push(previewRow);
    summary[previewRow.action]++;
  }

  return { summary, rows };
}

async function processRow(
  def: ImportObjectDefinition,
  opts: ImportEngineOptions,
  rowNumber: number,
  rawRow: Record<string, string>,
): Promise<ImportPreviewRow> {
  try {
    const { values, suppliedFields } = applyColumnMapping(
      rawRow,
      opts.columnMapping,
      def,
    );

    const match = await matchRecord(def, values);

    if (match.kind === "error") {
      if (opts.mode === "commit" && opts.skipErrors) {
        return rowResult(rowNumber, "skipped", rawRow, { error_message: match.message });
      }
      return rowResult(rowNumber, "error", rawRow, {
        error_message: match.message,
        match_method: match.method,
      });
    }

    if (match.kind === "duplicate_candidate") {
      if (opts.mode === "commit") {
        return rowResult(rowNumber, "skipped", rawRow, {
          match_method: match.method,
          ...candidateIdsToPreview(match.candidateIds, def.idType),
          error_message: `Duplicate candidate: ${match.candidateIds.length} records matched`,
        });
      }
      return rowResult(rowNumber, "duplicate_candidate", rawRow, {
        match_method: match.method,
        ...candidateIdsToPreview(match.candidateIds, def.idType),
        error_message: `${match.candidateIds.length} records matched (${match.candidateIds.join(", ")})`,
      });
    }

    const existing = match.kind === "found" ? match.record : null;
    const patch = computePatch(def, values, suppliedFields, existing);

    let refWarnings: string[] = [];
    if (def.validateReferences) {
      const refResult = await def.validateReferences(values, suppliedFields, existing, patch.writable);
      Object.assign(patch.writable, refResult.writablePatches);
      refWarnings = refResult.warnings;
      if (refResult.errors.length > 0) {
        const msg = refResult.errors.join("; ");
        if (opts.mode === "commit" && opts.skipErrors) {
          return rowResult(rowNumber, "skipped", rawRow, { error_message: msg });
        }
        return rowResult(rowNumber, "error", rawRow, { error_message: msg });
      }
    }

    if (patch.errors.length > 0) {
      const msg = patch.errors.join("; ");
      if (opts.mode === "commit" && opts.skipErrors) {
        return rowResult(rowNumber, "skipped", rawRow, { error_message: msg });
      }
      return rowResult(rowNumber, "error", rawRow, { error_message: msg });
    }

    let action: ImportRowAction = patch.action;

    if (opts.mode === "commit" && (action === "create" || action === "update" || action === "clear_value")) {
      if (action === "create") {
        await def.createRecord(patch.writable, {
          importRunId: opts.importRunId,
          sessionMetadata: opts.sessionMetadata,
        });
      } else if (existing) {
        await def.updateRecord(existing.id, patch.writable, {
          importRunId: opts.importRunId,
          sessionMetadata: opts.sessionMetadata,
          existing,
        });
      }
    }

    if (opts.mode === "commit" && action === "no_change") {
      action = "skipped";
    }

    const matchMethod = match.kind === "found" ? match.method : null;
    const idPreview = recordIdToPreview(existing, def.idType);

    return rowResult(rowNumber, action, rawRow, {
      match_method: matchMethod,
      ...idPreview,
      field_changes: patch.changes,
      changes_summary: summarizeChanges(patch.changes),
      warning_message: refWarnings.length > 0 ? refWarnings.join("; ") : null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (opts.mode === "commit" && opts.skipErrors) {
      return rowResult(rowNumber, "skipped", rawRow, { error_message: msg });
    }
    return rowResult(rowNumber, "error", rawRow, { error_message: msg });
  }
}

function rowResult(
  rowNumber: number,
  action: ImportRowAction,
  rawRow: Record<string, string>,
  extra: Partial<ImportPreviewRow>,
): ImportPreviewRow {
  return {
    row_number: rowNumber,
    action,
    raw_row: rawRow,
    match_method: null,
    matched_id: null,
    matched_record_id: null,
    candidate_ids: null,
    candidate_record_ids: null,
    error_message: null,
    warning_message: null,
    field_changes: null,
    changes_summary: null,
    ...extra,
  };
}

function summarizeChanges(changes: FieldChange[] | null | undefined): string | null {
  if (!changes?.length) return null;
  return changes
    .slice(0, 4)
    .map((c) => (c.op === "clear" ? `${c.field} → ∅` : `${c.field}`))
    .join(", ");
}
