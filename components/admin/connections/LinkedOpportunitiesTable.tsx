"use client";

import Link from "next/link";
import { formatOpportunityBudget } from "@/lib/opportunitiesList";
import { OPPORTUNITY_LEAD_TYPE_LABELS, OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { OPPORTUNITY_SALES_ROLE_LABELS } from "@/lib/opportunityValues";
import type { LinkedOpportunityRow } from "@/lib/repos/connectionOpportunities";
import { ConnectionsDrawerTableLink } from "@/components/admin/connections/ConnectionsDrawerHeader";

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
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-3 py-2 font-medium">Opportunity</th>
            <th className="px-3 py-2 font-medium">Role</th>
            {mode === "contact" ? <th className="px-3 py-2 font-medium">Company</th> : null}
            <th className="px-3 py-2 font-medium">Lead type</th>
            <th className="px-3 py-2 font-medium">Sales role</th>
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
            rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 align-top">
                <td className="px-3 py-2 font-medium text-slate-900">{row.client_name}</td>
                <td className="px-3 py-2 text-slate-700">{row.role_label}</td>
                {mode === "contact" ? (
                  <td className="px-3 py-2 text-slate-700">{row.company_name ?? "—"}</td>
                ) : null}
                <td className="px-3 py-2 text-slate-700">
                  {OPPORTUNITY_LEAD_TYPE_LABELS[row.lead_type] ?? row.lead_type}
                </td>
                <td className="px-3 py-2 text-slate-700">
                  {OPPORTUNITY_SALES_ROLE_LABELS[row.sales_role] ?? row.sales_role}
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
                  <ConnectionsDrawerTableLink href={`/admin/opportunities?opportunity=${row.id}`}>
                    Open
                  </ConnectionsDrawerTableLink>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
