import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImportWorkbenchFocus } from "@/components/admin/ImportWorkbenchFocus";
import { IMPORT_OBJECT_LABELS, IMPORT_OBJECT_TYPES } from "@/lib/import/types";
import { uploadImportAction } from "./actions";

type Props = {
  searchParams: Promise<{ objectType?: string }>;
};

export default async function ImportWorkbenchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const focusType = sp.objectType?.trim();

  return (
    <AdminShell
      title="Import / Export workbench"
      actions={
        <Link href="/admin/import/history" className="text-sm font-medium text-slate-700 hover:text-slate-900">
          Import history
        </Link>
      }
    >
      <ImportWorkbenchFocus objectType={focusType} />

      <p className="mb-2 text-sm text-slate-600">
        SAP-style data workbench: download templates, export live data, upload CSV, map columns, dry-run preview, then confirm import.
      </p>
      <p className="mb-6 text-sm text-slate-600">
        Patch rule: <strong>absent column</strong> = no change · <strong>blank cell</strong> = clear value · <strong>value</strong> = update.
        Match priority: internal ID → external_ref → natural key.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {IMPORT_OBJECT_TYPES.map((objectType) => {
          const focused = focusType === objectType;
          return (
            <section
              key={objectType}
              id={`import-${objectType}`}
              className={`rounded-xl border bg-white p-5 ${
                focused ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{IMPORT_OBJECT_LABELS[objectType]}</h2>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Link
                    href={`/api/admin/import/template/${objectType}`}
                    className="font-medium text-slate-900 underline"
                  >
                    Template
                  </Link>
                  <Link
                    href={`/api/admin/import/export/${objectType}`}
                    className="font-medium text-blue-800 underline"
                  >
                    Export all
                  </Link>
                </div>
              </div>

              <form action={uploadImportAction} className="mt-4 space-y-3">
                <input type="hidden" name="object_type" value={objectType} />
                <label className="block text-sm font-medium text-slate-700">
                  CSV file (UTF-8, max 5 MB)
                  <input
                    type="file"
                    name="file"
                    accept=".csv,text/csv"
                    required
                    className="mt-1 block w-full text-sm"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block text-sm text-slate-700">
                    Source system
                    <input name="source_system" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" placeholder="nml_export" />
                  </label>
                  <label className="block text-sm text-slate-700">
                    Source file
                    <input name="source_file" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                  </label>
                  <label className="block text-sm text-slate-700">
                    Source date
                    <input name="source_date" type="date" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                  </label>
                </div>
                <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  Upload &amp; map columns
                </button>
              </form>
            </section>
          );
        })}
      </div>
    </AdminShell>
  );
}
