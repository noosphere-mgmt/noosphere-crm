import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImportModuleCard } from "@/components/admin/ImportModuleCard";
import { ImportWorkbenchFocus } from "@/components/admin/ImportWorkbenchFocus";
import { ImportHistoryClient } from "@/components/admin/ImportHistoryClient";
import { IMPORT_OBJECT_LABELS, IMPORT_OBJECT_TYPES } from "@/lib/import/types";
import { listImportRuns } from "@/lib/repos/importRuns";
import { uploadImportAction } from "./actions";

type Props = {
  searchParams: Promise<{ objectType?: string; tab?: string }>;
};

export default async function ImportWorkbenchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const focusType = sp.objectType?.trim();
  const tab = sp.tab === "export" || sp.tab === "history" ? sp.tab : "import";
  const runs = tab === "history" ? await listImportRuns() : [];

  return (
    <AdminShell
      title="Data Management"
      module="tools"
      wide
    >
      <nav className="mb-4 flex w-fit gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1" aria-label="Data management sections">
        {(["import", "export", "history"] as const).map((item) => (
          <Link key={item} href={`/admin/import?tab=${item}`} className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${tab === item ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>{item}</Link>
        ))}
      </nav>

      {tab === "history" ? <ImportHistoryClient runs={runs} /> : (
        <>
          <ImportWorkbenchFocus objectType={focusType} />

          <p className="mb-3 text-sm text-slate-600">
            {tab === "import"
              ? <>Upload CSV → map columns → preview → confirm. Blank cells clear a value; missing columns leave existing data unchanged. Keep stable ID columns when updating.</>
              : <>Download a full current dataset for backup or editing, or use a clean template for new records.</>}
          </p>

          <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {IMPORT_OBJECT_TYPES.map((objectType) => (
              <ImportModuleCard key={objectType} objectType={objectType} label={IMPORT_OBJECT_LABELS[objectType]} uploadAction={uploadImportAction} focused={focusType === objectType} mode={tab} />
            ))}
          </div>
        </>
      )}
    </AdminShell>
  );
}
