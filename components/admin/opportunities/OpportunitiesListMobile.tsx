"use client";

import { isOpportunityOverdue } from "@/lib/opportunityStartDate";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OpportunitiesListState } from "@/components/admin/opportunities/useOpportunitiesList";
import { confirmDeleteOpportunity } from "@/components/admin/mobile/mobileListDelete";
import {
  MobileSwipeDeleteGroup,
  MobileSwipeToDeleteRow,
} from "@/components/admin/mobile/MobileSwipeToDeleteRow";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import {
  formatOpportunityExpectedFee,
  opportunityChineseDisplayName,
} from "@/lib/opportunitiesList";
import {
  formatOpportunityMoney,
  isRealisedWonRevenue,
  opportunityFinancials,
} from "@/lib/opportunityFinancials";
import { isActiveOpportunityStart } from "@/lib/opportunityStartDate";
import { opportunityStatusChip } from "@/lib/opportunityStatusTheme";

function formatDateLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 10);
}

export function OpportunitiesListMobile({
  state,
  onOpenWorkspace,
}: {
  state: OpportunitiesListState;
  onOpenWorkspace: (row: import("@/lib/types/entities").Opportunity) => void;
}) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();
  const { rows, displayedRows } = state;

  function deleteOpportunityRow(id: number, label: string) {
    startDelete(async () => {
      const deleted = await confirmDeleteOpportunity(label, id);
      if (deleted) router.refresh();
    });
  }

  return (
    <MobileSwipeDeleteGroup>
      <div className="space-y-2">
        {displayedRows.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            {rows.length === 0 ? "No opportunities yet." : "No opportunities match these filters."}
          </p>
        ) : (
          displayedRows.map((row) => {
            const id = String(row.id);
            const statusChip = opportunityStatusChip(row.status);
            const financials = opportunityFinancials(row);
            const commission = formatOpportunityMoney(financials.commission_income);
            const expectedFee = formatOpportunityExpectedFee(row.expected_fee);
            const meta = [
              row.linked_company_name ?? "No company",
              row.primary_contact_name,
              row.district_preference?.split(/[,;/|]/)[0]?.trim(),
            ].filter(Boolean);
            if (row.start_date && !isActiveOpportunityStart(row.start_date)) {
              meta.push(`Starts ${formatDateLabel(row.start_date)}`);
            }
            const clientZh = opportunityChineseDisplayName(row.client_name, row.linked_company_name_zh);
            return (
              <MobileSwipeToDeleteRow
                key={row.id}
                rowId={id}
                disabled={isDeleting}
                deleteLabel={`Delete ${row.client_name}`}
                onDelete={() => deleteOpportunityRow(row.id, row.client_name)}
                className="rounded-xl border border-l-4 border-[#D7E3DE] border-l-[#7FA596] bg-white shadow-[0_4px_14px_rgba(79,116,104,0.10)]"
              >
                <button
                  type="button"
                  onClick={() => onOpenWorkspace(row)}
                  className="block w-full cursor-pointer bg-white px-3 py-3 text-left active:bg-[#F5F9F7]"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="min-w-0 break-words text-sm font-semibold text-[#4F7468]">
                        {row.client_name}
                      </p>
                      {clientZh ? (
                        <p className="mt-0.5 min-w-0 break-words text-xs text-slate-500">{clientZh}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5 whitespace-nowrap">
                      <span className={statusChip.className} style={statusChip.style}>
                        {OPPORTUNITY_STATUS_LABELS[row.status]}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-slate-600" aria-label="Probability">
                        {row.probability == null ? "—" : `${row.probability}%`}
                      </span>
                    </div>
                  </div>
                  {isOpportunityOverdue(row) ? <p className="mt-1"><span className="inline-flex rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">Overdue</span> <span className="text-xs text-amber-800">Expected close {formatDateLabel(row.expected_close_date)}</span></p> : null}
                  <div className="mt-1.5 flex min-w-0 items-end justify-between gap-3 text-xs text-slate-600">
                    <span className="min-w-0 flex-1 truncate">{meta.join(" · ")}</span>
                    <span className="shrink-0 whitespace-nowrap text-right tabular-nums text-slate-500">
                      {commission !== "—"
                        ? `${isRealisedWonRevenue(row.status) ? "Won" : "Est."} ${commission} · `
                        : expectedFee !== "—"
                          ? `${expectedFee} · `
                          : ""}
                      {formatDateLabel(row.updated_at)}
                    </span>
                  </div>
                </button>
              </MobileSwipeToDeleteRow>
            );
          })
        )}
      </div>
    </MobileSwipeDeleteGroup>
  );
}
