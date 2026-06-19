"use client";

import { formatMoney } from "@/lib/formatCurrency";
import { partyRoleLabel } from "@/lib/opportunityPartiesDisplay";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

export function OpportunityFeesTab({ data }: { data: OpportunityDetailData }) {
  const { feeSummary } = data;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Read-only summary calculated from party fee records. Edit fees on the Parties tab.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Expected collect fee", value: feeSummary.expected_collect },
          { label: "Confirmed collect fee", value: feeSummary.confirmed_collect },
          { label: "Paid out fee", value: feeSummary.paid_out },
          { label: "Net fee", value: feeSummary.net_fee },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatMoney(card.value)}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-1.5 font-medium">Party</th>
              <th className="px-3 py-1.5 font-medium">Role</th>
              <th className="px-3 py-1.5 font-medium">Collect</th>
              <th className="px-3 py-1.5 font-medium">Paid out</th>
              <th className="px-3 py-1.5 font-medium">Net</th>
            </tr>
          </thead>
          <tbody>
            {feeSummary.by_party.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No party fees recorded yet.
                </td>
              </tr>
            ) : (
              feeSummary.by_party.map((row) => (
                <tr key={row.party_id} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 text-slate-900">{row.company_name}</td>
                  <td className="px-3 py-1.5 text-slate-700">{partyRoleLabel(row.role)}</td>
                  <td className="px-3 py-1.5 text-slate-700">{formatMoney(row.collect)}</td>
                  <td className="px-3 py-1.5 text-slate-700">{formatMoney(row.paid_out)}</td>
                  <td className="px-3 py-1.5 text-slate-700">{formatMoney(row.collect - row.paid_out)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
