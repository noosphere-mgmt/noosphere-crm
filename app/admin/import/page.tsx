import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImportModuleCard } from "@/components/admin/ImportModuleCard";
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
      title="Import"
      module="tools"
      wide
      actions={
        <Link href="/admin/import/history" className="text-sm font-medium text-slate-700 hover:text-slate-900">
          History
        </Link>
      }
    >
      <ImportWorkbenchFocus objectType={focusType} />

      <p className="mb-3 text-sm text-slate-600">
        Upload CSV → map columns → preview → confirm. Blank clears a value; missing column leaves data unchanged.
      </p>

      <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {IMPORT_OBJECT_TYPES.map((objectType) => (
          <ImportModuleCard
            key={objectType}
            objectType={objectType}
            label={IMPORT_OBJECT_LABELS[objectType]}
            uploadAction={uploadImportAction}
            focused={focusType === objectType}
          />
        ))}
      </div>
    </AdminShell>
  );
}
