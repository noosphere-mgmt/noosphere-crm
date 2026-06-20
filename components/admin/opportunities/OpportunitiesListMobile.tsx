"use client";

import type { OpportunitiesListState } from "@/components/admin/opportunities/useOpportunitiesList";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { formatOpportunityBudget } from "@/lib/opportunitiesList";
import { opportunityStatusChip } from "@/lib/opportunityStatusTheme";
import { MobileCard, MobileCardList, MobileCardMeta, MobileCardTitle } from "@/components/admin/mobile/MobileCard";

function formatDateLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 10);
}

export function OpportunitiesListMobile({
  state,
  onQuickView,
}: {
  state: OpportunitiesListState;
  onQuickView: (id: number) => void;
}) {
  const { rows, displayedRows } = state;

  return (
    <MobileCardList>
      {displayedRows.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-slate-500">
          {rows.length === 0 ? "No opportunities yet." : "No opportunities match your search."}
        </p>
      ) : (
        displayedRows.map((row) => (
          <MobileCard key={row.id} onClick={() => onQuickView(row.id)}>
            <div className="flex items-start justify-between gap-2">
              <MobileCardTitle>{row.client_name}</MobileCardTitle>
              <span {...opportunityStatusChip(row.status)} className="shrink-0 text-xs">
                {OPPORTUNITY_STATUS_LABELS[row.status]}
              </span>
            </div>
            <MobileCardMeta>
              {row.linked_company_name ?? "No company"}
              {row.district_preference ? ` · ${row.district_preference.split(/[,;/|]/)[0]?.trim()}` : ""}
            </MobileCardMeta>
            <MobileCardMeta>
              {formatOpportunityBudget(row.budget_max, row.budget_min)} · Updated{" "}
              {formatDateLabel(row.updated_at)}
            </MobileCardMeta>
          </MobileCard>
        ))
      )}
    </MobileCardList>
  );
}
