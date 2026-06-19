import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { IMPORT_OBJECT_LABELS } from "@/lib/import/types";
import { listImportRuns } from "@/lib/repos/importRuns";

export const dynamic = "force-dynamic";

export default async function ImportHistoryPage() {
  const runs = await listImportRuns();

  return (
    <AdminShell
      title="Import history"
      actions={
        <Link href="/admin/import" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          New import
        </Link>
      }
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Object</th>
              <th className="px-4 py-3 font-medium">File</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Cleared</th>
              <th className="px-4 py-3 font-medium">Skipped</th>
              <th className="px-4 py-3 font-medium">Errors</th>
              <th className="px-4 py-3 font-medium">Dupes</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                  No imports yet.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700">{run.import_date.slice(0, 16).replace("T", " ")}</td>
                  <td className="px-4 py-3">{IMPORT_OBJECT_LABELS[run.object_type]}</td>
                  <td className="px-4 py-3 text-slate-700">{run.filename}</td>
                  <td className="px-4 py-3 text-slate-700">{run.uploaded_by}</td>
                  <td className="px-4 py-3 tabular-nums">{run.created_count}</td>
                  <td className="px-4 py-3 tabular-nums">{run.updated_count}</td>
                  <td className="px-4 py-3 tabular-nums">{run.cleared_count}</td>
                  <td className="px-4 py-3 tabular-nums">{run.skipped_count}</td>
                  <td className="px-4 py-3 tabular-nums">{run.error_count}</td>
                  <td className="px-4 py-3 tabular-nums">{run.duplicate_count}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/import/runs/${run.id}`} className="font-medium text-slate-900 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
