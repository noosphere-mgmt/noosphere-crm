"use client";

import Link from "next/link";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import { premisesWorkspaceHref } from "@/lib/premisesWorkspaceNav";
import type { CompanyLinkedPropertyRow } from "@/lib/repos/companyLinkedProperties";

export function CompanySupplyTab({
  rows,
}: {
  companyId?: number;
  rows: CompanyLinkedPropertyRow[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          Premises and buildings linked through operator, owner, landlord, tenant, management, source, or
          relationship lines.
        </p>
        <Link href="/admin/properties/premises" className={`text-sm font-medium ${connectionsGlassClasses.link}`}>
          Browse all premises →
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Property</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Building</th>
              <th className="px-4 py-2 font-medium">Link role</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No properties or premises linked to this company yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.kind}-${row.id}`} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <div className="font-medium text-slate-900">{row.label}</div>
                    <RecordBusinessId id={row.business_id ?? row.id} className="mt-0.5 block" />
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {row.kind === "premise" ? "Premise" : "Building"}
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {row.kind === "premise" ? row.building_name ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {row.roles.length > 0 ? row.roles.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {row.kind === "premise" ? (
                        <Link
                          href={premisesWorkspaceHref(
                            { premises_id: row.id, business_id: row.business_id },
                            "relationships",
                          )}
                          className="text-sm font-medium text-violet-800 hover:underline"
                        >
                          Edit links
                        </Link>
                      ) : null}
                      <Link href={row.href} className="text-sm font-medium text-slate-700 hover:underline">
                        Open
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
