"use client";

import Link from "next/link";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { formatOpportunityBudget } from "@/lib/opportunitiesList";
import { OPPORTUNITY_LEAD_TYPE_LABELS, OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { opportunitySalesRoleLabel } from "@/lib/opportunityValues";
import type { LinkedOpportunityRow } from "@/lib/repos/connectionOpportunities";
import { opportunityDetailHref } from "@/lib/opportunityDetailNav";
import { companyFullPageHref } from "@/lib/crmDetailNav";

export function LinkedOpportunitiesTable({
  rows,
  mode,
  newOpportunityHref,
}: {
  rows: LinkedOpportunityRow[];
  mode: "company" | "contact";
  newOpportunityHref?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Opportunities</h3>
        {newOpportunityHref ? (
          <Link href={newOpportunityHref} className="text-sm font-medium text-violet-900 hover:underline">
            New opportunity
          </Link>
        ) : null}
      </div>
      <div className="space-y-2 p-3 md:hidden">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No linked opportunities.</p>
        ) : rows.map((row) => {
          const oppHref = opportunityDetailHref(row.id, "overview", undefined, row.business_id);
          return (
            <AdminEntityLink key={`mobile-${row.id}`} href={oppHref} className="block rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 font-semibold text-emerald-900">{row.client_name}</p>
                <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-emerald-800">{OPPORTUNITY_STATUS_LABELS[row.status]}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{[row.role_label, opportunitySalesRoleLabel(row.sales_role)].filter(Boolean).join(" · ")}</p>
              <p className="mt-1 text-xs text-slate-500">{formatOpportunityBudget(row.budget_max, row.budget_min)} · {row.updated_at?.slice(0, 10) ?? "—"}</p>
            </AdminEntityLink>
          );
        })}
      </div>
      <table className="hidden min-w-full text-sm md:table">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-3 py-2 font-medium">Opportunity</th>
            <th className="px-3 py-2 font-medium">Role</th>
            {mode === "contact" ? <th className="px-3 py-2 font-medium">Company</th> : null}
            <th className="px-3 py-2 font-medium">Lead Type</th>
            <th className="px-3 py-2 font-medium">Sales Role</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Budget</th>
            <th className="px-3 py-2 font-medium">Fee note</th>
            <th className="px-3 py-2 font-medium">Updated</th>
            <th className="w-16 px-3 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={mode === "contact" ? 10 : 9} className="px-4 py-8 text-center text-slate-500">
                No linked opportunities.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const oppHref = opportunityDetailHref(row.id, "overview", undefined, row.business_id);
              return (
                <tr key={row.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    <AdminEntityLink href={oppHref} className="text-violet-900 hover:underline">
                      {row.client_name}
                    </AdminEntityLink>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{row.role_label}</td>
                  {mode === "contact" ? (
                    <td className="px-3 py-2 text-slate-700">
                      <AdminEntityLink
                        href={companyFullPageHref(row.company_business_id)}
                        className="text-violet-900 hover:underline"
                      >
                        {row.company_name}
                      </AdminEntityLink>
                    </td>
                  ) : null}
                  <td className="px-3 py-2 text-slate-700">
                    {OPPORTUNITY_LEAD_TYPE_LABELS[row.lead_type] ?? row.lead_type}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {opportunitySalesRoleLabel(row.sales_role)}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{OPPORTUNITY_STATUS_LABELS[row.status]}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {formatOpportunityBudget(row.budget_max, row.budget_min)}
                  </td>
                  <td className="max-w-[10rem] px-3 py-2 whitespace-pre-wrap text-slate-700">
                    {row.fee_note?.trim() || "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{row.updated_at?.slice(0, 10) ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={oppHref} className="text-sm font-medium text-violet-800 hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
