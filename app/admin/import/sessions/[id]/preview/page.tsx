import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImportActionBadge, SummaryTiles } from "@/components/admin/ImportWorkbench";
import { IMPORT_OBJECT_LABELS } from "@/lib/import/types";
import { formatImportRowNotes } from "@/lib/import/rowNotes";
import { getImportSession } from "@/lib/repos/importSessions";
import { confirmImportAction } from "../../../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ImportPreviewPage({ params }: Props) {
  const { id } = await params;
  const session = await getImportSession(id);
  if (!session) notFound();
  if (session.status === "committed") redirect("/admin/import/history");
  if (!session.preview_summary || !session.preview_rows) {
    redirect(`/admin/import/sessions/${id}/mapping`);
  }

  const confirm = confirmImportAction.bind(null, id);
  const hasErrors = session.preview_summary.error > 0;
  const hasDuplicates = session.preview_summary.duplicate_candidate > 0;

  return (
    <AdminShell title={`Preview — ${IMPORT_OBJECT_LABELS[session.object_type]}`}>
      <p className="mb-2 text-sm text-slate-600">Dry run — no database changes yet.</p>
      <p className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Patch rule: <strong>absent column</strong> = no change · <strong>blank cell</strong> = clear value · <strong>value</strong> = update
      </p>
      <div className="mb-6">
        <SummaryTiles summary={session.preview_summary} variant="preview" />
      </div>

      {(hasErrors || hasDuplicates) && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {hasErrors ? <p>Errors found — enable &quot;Import valid rows only&quot; to skip them on confirm.</p> : null}
          {hasDuplicates ? <p>Duplicate candidate rows match multiple records and will be skipped on confirm.</p> : null}
        </div>
      )}

      <div className="mb-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Row</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Match</th>
              <th className="px-4 py-3 font-medium">Changes</th>
              <th className="px-4 py-3 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {session.preview_rows.map((row) => (
              <tr key={row.row_number} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3 tabular-nums">{row.row_number}</td>
                <td className="px-4 py-3">
                  <ImportActionBadge action={row.action} />
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {row.match_method ?? "—"}
                  {row.matched_id ? ` #${row.matched_id}` : ""}
                  {row.candidate_ids?.length ? (
                    <span className="mt-1 block text-xs text-purple-800">
                      Candidates: {row.candidate_ids.join(", ")}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-slate-700">{row.changes_summary ?? "—"}</td>
                <td className="max-w-xs px-4 py-3 text-slate-600">
                  {formatImportRowNotes(row.error_message, row.warning_message)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={confirm} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">
          Please keep the stable ID column unchanged when updating existing records.
        </p>
        {hasErrors ? (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="skip_errors" defaultChecked className="rounded border-slate-300" />
            Import valid rows only (skip errors)
          </label>
        ) : null}
        <div className="flex items-center gap-4">
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            Confirm import
          </button>
          <Link href={`/admin/import/sessions/${id}/mapping`} className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Back to mapping
          </Link>
        </div>
      </form>
    </AdminShell>
  );
}
