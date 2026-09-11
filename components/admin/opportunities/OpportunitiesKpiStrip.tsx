"use client";

import {
  IconNetProfit,
  IconPipelineValue,
  IconRelatedCosts,
  IconWonRevenue,
} from "@/components/admin/dashboard/dashboardIcons";
import type { Opportunity } from "@/lib/types/entities";
import {
  formatOpportunityMoney,
  formatOpportunityMoneyCompact,
  summariseEstimatedPipelineFinancials,
  summariseWonOpportunityFinancials,
} from "@/lib/opportunityFinancials";
import {
  occupiedPipelineStageCount,
  wonCostsRatio,
  wonCostsRecordCount,
  wonProfitMargin,
  wonRevenueAverage,
} from "@/lib/opportunityKpiVisuals";
import type { OpportunitiesKpiFilter } from "@/lib/opportunitiesList";

function formatShare(ratio: number | null, suffix: string): string {
  if (ratio == null) return "—";
  return `${(ratio * 100).toFixed(1)}% ${suffix}`;
}

export function OpportunitiesKpiStrip({
  rows,
  selectedKpi,
  onKpiFilterChange,
}: {
  rows: Opportunity[];
  selectedKpi: OpportunitiesKpiFilter | null;
  onKpiFilterChange: (kpi: OpportunitiesKpiFilter) => void;
}) {
  const won = summariseWonOpportunityFinancials(rows);
  const pipeline = summariseEstimatedPipelineFinancials(rows);
  const average = wonRevenueAverage(rows);
  const costsRatio = wonCostsRatio(rows);
  const profitMargin = wonProfitMargin(rows);
  const occupiedStages = occupiedPipelineStageCount(rows);

  const cards = [
    {
      key: "won_revenue" as const,
      label: "Won Revenue",
      count: won.opp_count,
      amount: formatOpportunityMoneyCompact(won.commission_income),
      title: formatOpportunityMoney(won.commission_income),
      insight: average == null ? "—" : `Avg. ${formatOpportunityMoneyCompact(average)}`,
      icon: <IconWonRevenue className="h-3.5 w-3.5" />,
      iconWrap: "bg-emerald-100/80 text-emerald-700",
      card: "border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-[0_0_18px_rgba(16,185,129,0.12)]",
      selectedCard: "border-emerald-400 ring-2 ring-emerald-300/70 shadow-[0_0_18px_rgba(16,185,129,0.28)]",
      valueClass: "text-emerald-950",
    },
    {
      key: "won_payouts" as const,
      label: "Won Payouts",
      count: wonCostsRecordCount(rows),
      amount: formatOpportunityMoneyCompact(won.related_costs),
      title: formatOpportunityMoney(won.related_costs),
      insight: formatShare(costsRatio, "of revenue"),
      icon: <IconRelatedCosts className="h-3.5 w-3.5" />,
      iconWrap: "bg-orange-100/80 text-orange-700",
      card: "border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-[0_0_18px_rgba(249,115,22,0.10)]",
      selectedCard: "border-orange-400 ring-2 ring-orange-300/70 shadow-[0_0_18px_rgba(249,115,22,0.28)]",
      valueClass: "text-orange-950",
    },
    {
      key: "won_net_profit" as const,
      label: "Won Net Profit",
      count: won.opp_count,
      amount: formatOpportunityMoneyCompact(won.net_profit),
      title: formatOpportunityMoney(won.net_profit),
      insight: formatShare(profitMargin, "margin"),
      icon: <IconNetProfit className="h-3.5 w-3.5" />,
      iconWrap: "bg-violet-100/80 text-violet-700",
      card: "border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 shadow-[0_0_18px_rgba(139,92,246,0.12)]",
      selectedCard: "border-violet-400 ring-2 ring-violet-300/70 shadow-[0_0_18px_rgba(139,92,246,0.28)]",
      valueClass: "text-violet-950",
    },
    {
      key: "pipeline_estimate" as const,
      label: "Pipeline Estimate",
      count: pipeline.opp_count,
      amount: formatOpportunityMoneyCompact(pipeline.commission_income),
      title: formatOpportunityMoney(pipeline.commission_income),
      insight: `${occupiedStages} ${occupiedStages === 1 ? "stage" : "stages"}`,
      icon: <IconPipelineValue className="h-3.5 w-3.5" />,
      iconWrap: "bg-sky-100/80 text-sky-700",
      card: "border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-cyan-50 shadow-[0_0_18px_rgba(14,165,233,0.12)]",
      selectedCard: "border-sky-400 ring-2 ring-sky-300/70 shadow-[0_0_18px_rgba(14,165,233,0.28)]",
      valueClass: "text-sky-950",
    },
  ];

  return (
    <section aria-label="Opportunity KPIs" className="mb-2 grid grid-cols-2 gap-2 xl:grid-cols-4">
      {cards.map((card) => {
        const selected = selectedKpi === card.key;
        return (
          <button
            key={card.key}
            type="button"
            title={card.title}
            aria-pressed={selected}
            onClick={() => onKpiFilterChange(card.key)}
            className={`flex flex-col justify-center gap-1.5 rounded-xl border px-3 py-2 text-left ${
              selected ? card.selectedCard : card.card
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 text-[10px] font-semibold text-slate-600">
                <span className="uppercase tracking-[0.08em]">{card.label}</span>{" "}
                <span className="tabular-nums tracking-normal">({card.count})</span>
              </p>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${card.iconWrap}`}>{card.icon}</span>
            </div>
            <p className="flex min-w-0 items-baseline gap-2">
              <span className={`shrink-0 text-[1.35rem] font-semibold tabular-nums leading-none tracking-tight ${card.valueClass}`}>
                {card.amount}
              </span>
              <span className="min-w-0 truncate text-[11px] font-medium tabular-nums text-slate-500">{card.insight}</span>
            </p>
          </button>
        );
      })}
    </section>
  );
}
