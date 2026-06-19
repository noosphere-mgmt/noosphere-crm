import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { listBuildings } from "@/lib/repos/buildings";

export const dynamic = "force-dynamic";

export default async function BuildingsListPage() {
  let rows: Awaited<ReturnType<typeof listBuildings>> = [];
  try {
    rows = await listBuildings();
  } catch {
    redirect("/admin");
  }

  return (
    <AdminShell
      title="Buildings"
      actions={
        <Link
          href="/admin/buildings/new"
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
        >
          New building
        </Link>
      }
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Building</th>
              <th className="px-4 py-3 font-medium">District</th>
              <th className="px-4 py-3 font-medium">Tower / block</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">MTR</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No buildings yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.name_en}</td>
                  <td className="px-4 py-3 text-slate-700">{row.district || "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{row.tower_block ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{row.grade ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{row.mtr_station ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/buildings/${row.id}`} className="font-medium text-slate-900 hover:underline">
                      Edit
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
