import { ImportActionBadge } from "@/components/admin/ImportWorkbench";
import {
  formatFieldChangeValue,
  formatImportActionLabel,
  importRowMatchedId,
  importRowRecordLabel,
  parseFieldChanges,
  summarizeFieldChanges,
} from "@/lib/import/rowDisplay";
import type { FieldChange, ImportObjectType } from "@/lib/import/types";
import type { ImportRunRow } from "@/lib/repos/importRuns";

function FieldChangesDetail({ changes }: { changes: FieldChange[] }) {
  if (changes.length === 0) return null;

  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs font-medium text-blue-700 hover:text-blue-900">
        {changes.length} field{changes.length === 1 ? "" : "s"} changed
      </summary>
      <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-2 py-1.5 font-medium">Field</th>
              <th className="px-2 py-1.5 font-medium">Old value</th>
              <th className="px-2 py-1.5 font-medium">New value</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((change) => (
              <tr key={`${change.field}-${change.op}`} className="border-t border-slate-100">
                <td className="px-2 py-1.5 font-medium text-slate-800">{change.label || change.field}</td>
                <td className="max-w-[12rem] truncate px-2 py-1.5 text-slate-600" title={formatFieldChangeValue(change.old_value)}>
                  {formatFieldChangeValue(change.old_value)}
                </td>
                <td className="max-w-[12rem] truncate px-2 py-1.5 text-slate-800" title={formatFieldChangeValue(change.new_value)}>
                  {change.op === "clear" ? "∅" : formatFieldChangeValue(change.new_value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function ImportRunRowsTable({
  rows,
  objectType,
  columnMapping,
}: {
  rows: ImportRunRow[];
  objectType: ImportObjectType;
  columnMapping: Record<string, string>;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
        No row-level results were stored for this import run.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">Row</th>
            <th className="px-4 py-3 font-medium">Action</th>
            <th className="px-4 py-3 font-medium">Record</th>
            <th className="px-4 py-3 font-medium">Matched ID</th>
            <th className="px-4 py-3 font-medium">Columns touched</th>
            <th className="px-4 py-3 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const changes = parseFieldChanges(row.field_changes);
            const recordLabel = importRowRecordLabel(
              objectType,
              row.raw_row,
              columnMapping,
              row.matched_record_id,
              row.matched_id,
            );
            const matchedId = importRowMatchedId(row.matched_record_id, row.matched_id);
            const showChanges = changes && changes.length > 0;

            return (
              <tr key={row.row_number} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3 tabular-nums text-slate-700">{row.row_number}</td>
                <td className="px-4 py-3">
                  <ImportActionBadge action={row.action} />
                  <span className="sr-only">{formatImportActionLabel(row.action)}</span>
                </td>
                <td className="max-w-xs px-4 py-3 text-slate-900">{recordLabel}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{matchedId}</td>
                <td className="max-w-xs px-4 py-3 text-slate-700">
                  {showChanges ? summarizeFieldChanges(changes) : "—"}
                  {showChanges ? <FieldChangesDetail changes={changes} /> : null}
                </td>
                <td className="max-w-md px-4 py-3 text-slate-600">
                  {row.error_message?.trim() ? row.error_message : "—"}
                  {row.match_method ? (
                    <p className="mt-1 text-xs text-slate-500">Match: {row.match_method}</p>
                  ) : null}
                  {row.candidate_ids?.length ? (
                    <p className="mt-1 text-xs text-purple-800">
                      Candidates: {row.candidate_ids.join(", ")}
                    </p>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
