"use client";

import {
  OPPORTUNITIES_LIST_STATUS_FILTER_LABELS,
  OPPORTUNITIES_OPERATION_STATUS_METER_FILTERS,
  isOpportunitiesOperationStatusFilter,
  nextOpportunitiesJourneyFilter,
  type OpportunitiesListStatusFilter,
  type OpportunitiesOperationStatusFilter,
} from "@/lib/opportunitiesList";

const METER_COLORS: Record<OpportunitiesOperationStatusFilter, { from: string; to: string; glow: string }> = {
  qualifying: { from: "#0F766E", to: "#14B8A6", glow: "rgba(20,184,166,0.45)" },
  sourcing: { from: "#0369A1", to: "#0EA5E9", glow: "rgba(14,165,233,0.45)" },
  proposal_reviewing: { from: "#6D28D9", to: "#8B5CF6", glow: "rgba(139,92,246,0.45)" },
  negotiating: { from: "#C2410C", to: "#F59E0B", glow: "rgba(245,158,11,0.45)" },
  closed: { from: "#475569", to: "#64748B", glow: "rgba(100,116,139,0.35)" },
};

/** Width follows label length, not volume. */
const METER_FLEX: Record<OpportunitiesOperationStatusFilter, number> = {
  qualifying: 1.15,
  sourcing: 1,
  proposal_reviewing: 1.15,
  negotiating: 1.15,
  closed: 1,
};

export function OpportunitiesOperationStatusMeter({
  listStatusFilter,
  onListStatusFilterChange,
  counts,
  usingLegacyStatusFilter,
}: {
  listStatusFilter: OpportunitiesListStatusFilter;
  onListStatusFilterChange: (filter: OpportunitiesListStatusFilter) => void;
  counts: Record<OpportunitiesListStatusFilter, number>;
  usingLegacyStatusFilter?: boolean;
}) {
  const selected =
    !usingLegacyStatusFilter && isOpportunitiesOperationStatusFilter(listStatusFilter)
      ? listStatusFilter
      : null;

  return (
    <section aria-label="Operation Status" className="mb-2">
      <p className="mb-1 text-[11px] font-medium tracking-wide text-slate-500">Operation Status</p>
      <div className="flex h-10 overflow-x-auto overflow-y-hidden rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.08)] md:overflow-visible">
        {OPPORTUNITIES_OPERATION_STATUS_METER_FILTERS.map((status, index) => {
          const active = selected === status;
          const muted = selected != null && !active;
          const color = METER_COLORS[status];
          const count = counts[status];
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              aria-label={`${OPPORTUNITIES_LIST_STATUS_FILTER_LABELS[status]} ${count}`}
              onClick={() =>
                onListStatusFilterChange(nextOpportunitiesJourneyFilter(listStatusFilter, status))
              }
              className="relative flex h-10 min-w-[6.75rem] items-center justify-center px-2 text-[11px] font-medium text-white md:min-w-0"
              style={{
                flex: METER_FLEX[status],
                backgroundImage: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                opacity: muted ? 0.62 : count === 0 && !active ? 0.82 : 1,
                boxShadow: active ? `inset 0 0 0 2px rgba(255,255,255,0.88), 0 0 14px ${color.glow}` : undefined,
                filter: muted ? "saturate(0.78)" : undefined,
                borderTopLeftRadius: index === 0 ? "0.75rem" : 0,
                borderBottomLeftRadius: index === 0 ? "0.75rem" : 0,
                borderTopRightRadius:
                  index === OPPORTUNITIES_OPERATION_STATUS_METER_FILTERS.length - 1 ? "0.75rem" : 0,
                borderBottomRightRadius:
                  index === OPPORTUNITIES_OPERATION_STATUS_METER_FILTERS.length - 1 ? "0.75rem" : 0,
              }}
            >
              {index > 0 ? (
                <span className="pointer-events-none absolute inset-y-0 left-0 w-px bg-white/35" aria-hidden />
              ) : null}
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                {active ? <span aria-hidden>✓</span> : null}
                <span>{OPPORTUNITIES_LIST_STATUS_FILTER_LABELS[status]}</span>
                <span className="font-bold tabular-nums">{count}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
