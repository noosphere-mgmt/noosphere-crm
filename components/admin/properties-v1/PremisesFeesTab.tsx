"use client";

import { PremisesDrawerTableLink } from "@/components/admin/properties-v1/PremisesDrawerHeader";
import { PremisesMetric, PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import { formatMoney } from "@/lib/formatCurrency";
import type { PremisesFeeSummary } from "@/lib/repos/opportunityProposedPremises";

function formatFeeStatus(status: string | null | undefined): string {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function PremisesFeesTab({ fees }: { fees: PremisesFeeSummary }) {
  return (
    <div className="space-y-4">
      <PremisesSectionCard title="Fee summary">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <PremisesMetric label="Expected collect" value={formatMoney(fees.expected_collect, "HKD")} />
          <PremisesMetric label="Confirmed collect" value={formatMoney(fees.confirmed_collect, "HKD")} />
          <PremisesMetric label="Paid out" value={formatMoney(fees.paid_out, "HKD")} />
          <PremisesMetric label="Net fee" value={formatMoney(fees.net_fee, "HKD")} />
        </dl>
      </PremisesSectionCard>

      <PremisesSectionCard title="Fee lines">
        <div className="overflow-x-auto rounded-lg border border-white/80 bg-white/70">
          <table className="min-w-full text-sm">
            <thead className="bg-blue-50/80 text-left text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Opportunity</th>
                <th className="px-3 py-2 font-medium">Collect from</th>
                <th className="px-3 py-2 font-medium">Expected collect</th>
                <th className="px-3 py-2 font-medium">Paid out to</th>
                <th className="px-3 py-2 font-medium">Paid out fee</th>
                <th className="px-3 py-2 font-medium">Net fee</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {fees.lines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No fee records linked to this premises yet.
                  </td>
                </tr>
              ) : (
                fees.lines.map((line) => (
                  <tr key={line.id} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2 font-medium text-slate-900">
                      <PremisesDrawerTableLink href={`/admin/opportunities/${line.opportunity_id}?tab=fees`}>
                        {line.opportunity_client_name ?? `Opportunity #${line.opportunity_id}`}
                      </PremisesDrawerTableLink>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{line.collect_fee_from_company_name ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {line.collect_fee_amount ? formatMoney(line.collect_fee_amount, "HKD") : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{line.paid_out_to_company_name ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {line.paid_out_fee_amount ? formatMoney(line.paid_out_fee_amount, "HKD") : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {line.net_fee != null ? formatMoney(line.net_fee, "HKD") : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {formatFeeStatus(line.collect_fee_status ?? line.paid_out_status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PremisesSectionCard>
    </div>
  );
}
