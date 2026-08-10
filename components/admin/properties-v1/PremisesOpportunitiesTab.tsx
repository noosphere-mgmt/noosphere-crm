"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { patchProposedPremisesLineInlineAction } from "@/app/admin/opportunities/workspaceActions";
import { PremisesDrawerTableLink } from "@/components/admin/properties-v1/PremisesDrawerHeader";
import { PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import { asArray } from "@/lib/asArray";
import {
  formatProposedPremisesProposedPrice,
  proposedPremisesListingRemarks,
} from "@/lib/proposedPremisesDisplay";
import {
  PROPOSED_PREMISES_STATUSES,
  PROPOSED_PREMISES_STATUS_LABELS,
  normalizeProposedPremisesStatus,
} from "@/lib/opportunityValues";
import type { PremisesProposedOpportunityRow } from "@/lib/repos/opportunityProposedPremises";

const cellSelect =
  "w-full min-w-0 rounded border border-slate-200 bg-white px-1.5 py-1 text-sm text-slate-800 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-100";

function formatOpportunityLabel(row: PremisesProposedOpportunityRow): string {
  const district = row.opportunity_district?.split(/[,;/|]/)[0]?.trim();
  const base = row.opportunity_client_name ?? `Deal #${row.opportunity_id}`;
  return district ? `${base} – ${district}` : base;
}

function PremisesOpportunityStatusCell({
  row,
  onUpdated,
}: {
  row: PremisesProposedOpportunityRow;
  onUpdated: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function saveStatus(status: string) {
    if (status === row.status) return;
    const fd = new FormData();
    fd.set("opportunity_id", String(row.opportunity_id));
    fd.set("status", status);
    startTransition(async () => {
      await patchProposedPremisesLineInlineAction(row.id, row.opportunity_id, fd);
      onUpdated();
    });
  }

  return (
    <select
      className={cellSelect}
      value={normalizeProposedPremisesStatus(row.status)}
      disabled={pending}
      onChange={(e) => saveStatus(e.target.value)}
      aria-label="Opportunity status"
    >
      {PROPOSED_PREMISES_STATUSES.map((s) => (
        <option key={s} value={s}>
          {PROPOSED_PREMISES_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

export function PremisesOpportunitiesTab({ rows }: { rows: PremisesProposedOpportunityRow[] | null | undefined }) {
  const router = useRouter();
  const safeRows = asArray<PremisesProposedOpportunityRow>(rows);

  return (
    <PremisesSectionCard title="Proposed on opportunities">
      <div className="overflow-x-auto rounded-lg border border-white/80 bg-white/70">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-50/80 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Opportunity</th>
              <th className="px-3 py-2 font-medium">Client / Company</th>
              <th className="px-3 py-2 font-medium">Contact</th>
              <th className="px-3 py-2 font-medium">Proposed price</th>
              <th className="px-3 py-2 font-medium">Opportunity status</th>
              <th className="px-3 py-2 font-medium">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {safeRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  This premises has not been proposed on any opportunity yet.
                </td>
              </tr>
            ) : (
              safeRows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    <PremisesDrawerTableLink href={`/admin/opportunities/${row.opportunity_id}`}>
                      {formatOpportunityLabel(row)}
                    </PremisesDrawerTableLink>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{row.opportunity_company_name ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-700">{row.opportunity_contact_name ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-700">{formatProposedPremisesProposedPrice(row)}</td>
                  <td className="px-3 py-2 text-slate-700">
                    <PremisesOpportunityStatusCell row={row} onUpdated={() => router.refresh()} />
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
