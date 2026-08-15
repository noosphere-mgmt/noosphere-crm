"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OpportunitiesListState } from "@/components/admin/opportunities/useOpportunitiesList";
import { confirmDeleteOpportunity } from "@/components/admin/mobile/mobileListDelete";
import {
  MobileSwipeDeleteGroup,
  MobileSwipeToDeleteRow,
} from "@/components/admin/mobile/MobileSwipeToDeleteRow";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { formatOpportunityExpectedFee } from "@/lib/opportunitiesList";
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
            {rows.length === 0 ? "No opportunities yet." : "No opportunities match your search."}
          </p>
        ) : (
          displayedRows.map((row) => {
            const id = String(row.id);
            const statusChip = opportunityStatusChip(row.status);
            const expectedFee = formatOpportunityExpectedFee(row.expected_fee);
            const meta = [
              row.linked_company_name ?? "No company",
              row.primary_contact_name,
              row.district_preference?.split(/[,;/|]/)[0]?.trim(),
            ].filter(Boolean);
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
                    </div>
                    <span
                      className={`${statusChip.className} shrink-0 whitespace-nowrap`}
                      style={statusChip.style}
                    >
                      {OPPORTUNITY_STATUS_LABELS[row.status]}
                    </span>
                  </div>
                  <div className="mt-1.5 flex min-w-0 items-end justify-between gap-3 text-xs text-slate-600">
                    <span className="min-w-0 flex-1 truncate">{meta.join(" · ")}</span>
                    <span className="shrink-0 whitespace-nowrap text-right tabular-nums text-slate-500">
                      {expectedFee !== "—" ? `${expectedFee} · ` : ""}
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
