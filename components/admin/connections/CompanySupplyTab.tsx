"use client";

import Link from "next/link";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import type { Asset } from "@/lib/types/entities";

function spaceLinkRoles(space: Asset, companyId: number): string[] {
  const roles: string[] = [];
  if (space.operator_company_id === companyId) roles.push("Operator");
  if (space.landlord_company_id === companyId) roles.push("Landlord");
  if (space.current_tenant_company_id === companyId) roles.push("Tenant");
  return roles;
}

export function CompanySupplyTab({
  companyId,
  spaces,
}: {
  companyId: number;
  spaces: Asset[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          Properties and premises linked through operator, owner, landlord, tenant, or relationship lines.
        </p>
        <Link href="/admin/properties/premises" className={`text-sm font-medium ${connectionsGlassClasses.link}`}>
          Browse all premises →
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Space</th>
              <th className="px-4 py-2 font-medium">Building</th>
              <th className="px-4 py-2 font-medium">Link role</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {spaces.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No properties or premises linked to this company yet.
                </td>
              </tr>
            ) : (
              spaces.map((space) => (
                <tr key={space.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{space.display_name_en}</td>
                  <td className="px-4 py-2 text-slate-700">{space.building_name ?? space.building_label ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-700">
                    {spaceLinkRoles(space, companyId).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/admin/assets/${space.id}`} className="text-sm font-medium text-violet-800 hover:underline">
                      Open
                    </Link>
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
