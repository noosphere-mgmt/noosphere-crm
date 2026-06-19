import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImportActionBadge, SummaryTiles } from "@/components/admin/ImportWorkbench";
import { IMPORT_OBJECT_LABELS } from "@/lib/import/types";
import { getImportRun, listImportRunRows } from "@/lib/repos/importRuns";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ImportRunResultPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();

  const run = await getImportRun(id);
  if (!run) notFound();

  const rows = await listImportRunRows(id);
  const summary = run.summary ?? {
    create: run.created_count,
    update: run.updated_count,
    clear_value: run.cleared_count,
    no_change: 0,
    duplicate_candidate: run.duplicate_count,
    error: run.error_count,
    skipped: run.skipped_count,
  };

  return (
    <AdminShell
      title="Import complete"
      actions={
        <Link href="/admin/import/history" className="text-sm font-medium text-slate-700 hover:text-slate-900">
          Import history
        </Link>
      }
    >
      <p className="mb-2 text-sm text-slate-600">
        {IMPORT_OBJECT_LABELS[run.object_type]} · {run.filename} · Run #{run.id}
      </p>
      {(run.source_system || run.source_file || run.source_date) && (
        <p className="mb-4 text-xs text-slate-500">
          Source: {[run.source_system, run.source_file, run.source_date?.slice(0, 10)].filter(Boolean).join(" · ")}
        </p>
      )}

      <div className="mb-6">
        <SummaryTiles summary={summary} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Row</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Matched ID</th>
              <th className="px-4 py-3 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.row_number} className="border-t border-slate-100">
                <td className="px-4 py-3">{row.row_number}</td>
                <td className="px-4 py-3">
                  <ImportActionBadge action={row.action} />
                </td>
                <td className="px-4 py-3">{row.matched_id ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{row.error_message ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-4">
        <Link href="/admin/import" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          New import
        </Link>
        {run.object_type === "buildings" ? (
          <Link href="/admin/buildings" className="text-sm font-medium text-slate-700 underline">
            View buildings
          </Link>
        ) : (
          <Link href="/admin/companies" className="text-sm font-medium text-slate-700 underline">
            View companies
          </Link>
        )}
      </div>
    </AdminShell>
  );
}
