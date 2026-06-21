import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImportHistoryClient } from "@/components/admin/ImportHistoryClient";
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
      <ImportHistoryClient runs={runs} />
    </AdminShell>
  );
}
