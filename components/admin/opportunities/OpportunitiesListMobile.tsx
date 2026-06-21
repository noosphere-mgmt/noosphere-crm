"use client";

import type { OpportunitiesListState } from "@/components/admin/opportunities/useOpportunitiesList";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { formatOpportunityBudget } from "@/lib/opportunitiesList";
import { opportunityStatusChip } from "@/lib/opportunityStatusTheme";
import { MobileCardMeta, MobileCardTitle } from "@/components/admin/mobile/MobileCard";

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
  const { rows, displayedRows, selected, toggleOne, toggleAll, allDisplayedSelected, displayedIds } = state;

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {displayedRows.length > 0 ? (
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
          <input
            type="checkbox"
            checked={allDisplayedSelected}
            onChange={(e) => toggleAll(displayedIds, e.target.checked)}
            aria-label="Select all opportunities"
            className="rounded border-slate-300"
          />
          <span className="text-xs text-slate-500">Select all</span>
        </div>
      ) : null}

      {displayedRows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-500">
          {rows.length === 0 ? "No opportunities yet." : "No opportunities match your search."}
        </p>
      ) : (
        displayedRows.map((row) => {
          const id = String(row.id);
          return (
            <div
              key={row.id}
              className="flex items-start gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0"
            >
              <input
                type="checkbox"
                checked={selected.has(id)}
                onChange={() => toggleOne(id)}
                aria-label={`Select ${row.client_name}`}
                className="mt-1 rounded border-slate-300"
              />
              <button
                type="button"
                onClick={() => onQuickView(row.id)}
                className="min-w-0 flex-1 text-left"
              >
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
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
