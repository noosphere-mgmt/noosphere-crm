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
      <div className="space-y-2 md:hidden">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            No properties or premises linked to this company yet.
          </p>
        ) : (
          rows.map((row) => (
            <Link
              key={`mobile-${row.kind}-${row.id}`}
              href={row.href}
              className="block rounded-xl border border-l-4 border-[#D2E1E3] border-l-[#79A9AF] bg-[#F1F7F7] p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-words font-semibold text-[#356C73] underline-offset-2">
                  {row.label}
                </p>
                <span className="shrink-0 rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold text-[#356C73]">
                  {row.kind === "premise" ? "Premise" : "Building"}
                </span>
              </div>
              {row.kind === "premise" && row.building_name ? (
                <p className="mt-1 text-xs text-slate-600">{row.building_name}</p>
              ) : null}
              <p className="mt-1 text-xs text-slate-500">
                {row.roles.length > 0 ? row.roles.join(", ") : "Relationship not specified"}
              </p>
            </Link>
          ))
        )}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
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
                <tr key={`${row.kind}-${row.id}`} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-2">
                    <Link
                      href={row.href}
                      className="font-medium text-sky-800 underline-offset-2 hover:underline"
                    >
                      {row.label}
                    </Link>
                    <RecordBusinessId id={row.business_id ?? row.id} className="mt-0.5 block" />
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {row.kind === "premise" ? "Premise" : "Building"}
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {row.kind === "premise" ? (
                      row.building_name ? (
                        row.building_href ? (
                          <Link
                            href={row.building_href}
                            className="text-sky-800 underline-offset-2 hover:underline"
                          >
                            {row.building_name}
                          </Link>
                        ) : (
                          row.building_name
                        )
                      ) : (
                        "—"
                      )
                    ) : (
                      "—"
                    )}
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
