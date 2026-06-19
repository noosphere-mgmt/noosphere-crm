"use client";

import { PremisesDrawerTableLink } from "@/components/admin/properties-v1/PremisesDrawerHeader";
import { PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import {
  formatProposedPremisesProposedPrice,
  formatProposedPremisesTourDate,
  proposedPremisesListingRemarks,
} from "@/lib/proposedPremisesDisplay";
import {
  PROPOSED_PREMISES_PREFERENCE_LABELS,
  PROPOSED_PREMISES_STATUS_LABELS,
} from "@/lib/opportunityValues";
import type { PremisesProposedOpportunityRow } from "@/lib/repos/opportunityProposedPremises";

function formatOpportunityLabel(row: PremisesProposedOpportunityRow): string {
  const district = row.opportunity_district?.split(/[,;/|]/)[0]?.trim();
  const base = row.opportunity_client_name ?? `Opportunity #${row.opportunity_id}`;
  return district ? `${base} – ${district}` : base;
}

export function PremisesOpportunitiesTab({ rows }: { rows: PremisesProposedOpportunityRow[] }) {
  return (
    <PremisesSectionCard title="Proposed on opportunities">
      <div className="overflow-x-auto rounded-lg border border-white/80 bg-white/70">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-50/80 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Opportunity</th>
              <th className="px-3 py-2 font-medium">Client / Company</th>
              <th className="px-3 py-2 font-medium">Contact</th>
              <th className="px-3 py-2 font-medium">Tour date</th>
              <th className="px-3 py-2 font-medium">Proposed price</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Preference</th>
              <th className="px-3 py-2 font-medium">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  This premises has not been proposed on any opportunity yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    <PremisesDrawerTableLink href={`/admin/opportunities/${row.opportunity_id}`}>
                      {formatOpportunityLabel(row)}
                    </PremisesDrawerTableLink>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{row.opportunity_company_name ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-700">{row.opportunity_contact_name ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-700">{formatProposedPremisesTourDate(row)}</td>
                  <td className="px-3 py-2 text-slate-700">{formatProposedPremisesProposedPrice(row)}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {PROPOSED_PREMISES_STATUS_LABELS[row.status] ?? row.status}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {row.preference ? (PROPOSED_PREMISES_PREFERENCE_LABELS[row.preference] ?? row.preference) : "—"}
                  </td>
                  <td className="max-w-[10rem] px-3 py-2 whitespace-pre-wrap text-slate-700">
                    {proposedPremisesListingRemarks(row) || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PremisesSectionCard>
  );
}
