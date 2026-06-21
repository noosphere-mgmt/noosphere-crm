import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { SubmitButton } from "@/components/admin/AdminFormFields";
import { MappingSelect } from "@/components/admin/ImportWorkbench";
import { IMPORT_OBJECT_LABELS } from "@/lib/import/types";
import { getImportSession } from "@/lib/repos/importSessions";
import { listMappingFieldOptions } from "@/lib/import/objectRegistry";
import { saveMappingAndPreviewAction } from "../../../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ImportMappingPage({ params }: Props) {
  const { id } = await params;
  const session = await getImportSession(id);
  if (!session) notFound();
  if (session.status === "committed") redirect("/admin/import/history");

  const fieldOptions = listMappingFieldOptions(session.object_type);
  const preview = saveMappingAndPreviewAction.bind(null, id);
  const sampleRow = session.parsed_rows[0];

  return (
    <AdminShell title={`Map columns — ${IMPORT_OBJECT_LABELS[session.object_type]}`}>
      <p className="mb-4 text-sm text-slate-600">
        File: <span className="font-medium">{session.filename}</span> · {session.row_count} rows
      </p>

      <form action={preview} className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">CSV column</th>
                <th className="px-4 py-3 font-medium">System field</th>
                <th className="px-4 py-3 font-medium">Sample</th>
              </tr>
            </thead>
            <tbody>
              {session.csv_headers.map((header) => (
                <tr key={header} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{header}</td>
                  <td className="px-4 py-3">
                    <MappingSelect
                      header={header}
                      fieldOptions={fieldOptions}
                      defaultValue={session.column_mapping[header] ?? ""}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{sampleRow?.[header] ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-4">
          <SubmitButton label="Preview import (dry run)" />
          <Link href="/admin/import" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Cancel
          </Link>
        </div>
      </form>
    </AdminShell>
  );
}
