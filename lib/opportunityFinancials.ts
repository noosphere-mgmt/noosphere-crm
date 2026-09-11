import type { Opportunity, OpportunityStatus } from "@/lib/types/entities";

export type OpportunityMoneyAmount = number | null;

export type OpportunityFinancials = {
  commission_income: OpportunityMoneyAmount;
  related_costs: OpportunityMoneyAmount;
  net_profit: OpportunityMoneyAmount;
};

export type WonOpportunityFinancialsSummary = {
  opp_count: number;
  commission_income: number;
  related_costs: number;
  net_profit: number;
  per_opportunity: Array<{
    id: number;
    commission_income: OpportunityMoneyAmount;
    related_costs: OpportunityMoneyAmount;
    net_profit: OpportunityMoneyAmount;
    realised: true;
  }>;
};

/** Parse a form/API/DB money value. Empty is null; "0" is zero. */
export function parseOpportunityMoney(value: unknown): OpportunityMoneyAmount {
  if (value == null) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return Math.round(value * 100) / 100;
  }
  const s = String(value).trim().replace(/,/g, "");
  if (!s) return null;
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

export function opportunityNetProfit(
  commissionIncome: OpportunityMoneyAmount,
  relatedCosts: OpportunityMoneyAmount,
): OpportunityMoneyAmount {
  if (commissionIncome == null && relatedCosts == null) return null;
  return Math.round(((commissionIncome ?? 0) - (relatedCosts ?? 0)) * 100) / 100;
}

export function opportunityFinancials(
  opportunity: Pick<Opportunity, "commission_income" | "related_costs" | "net_profit">,
): OpportunityFinancials {
  const commission_income = parseOpportunityMoney(opportunity.commission_income);
  const related_costs = parseOpportunityMoney(opportunity.related_costs);
  const storedProfit = parseOpportunityMoney(opportunity.net_profit);
  return {
    commission_income,
    related_costs,
    net_profit: storedProfit ?? opportunityNetProfit(commission_income, related_costs),
  };
}

export function isWonOpportunityStatus(status: OpportunityStatus | string | null | undefined): boolean {
  return status === "closed_won";
}

/** Open/pipeline values may be stored, but they are estimates — not realised Won Revenue. */
export function isRealisedWonRevenue(status: OpportunityStatus | string | null | undefined): boolean {
  return isWonOpportunityStatus(status);
}

export function formatOpportunityMoney(value: OpportunityMoneyAmount | string | undefined): string {
  const n = parseOpportunityMoney(value);
  if (n == null) return "—";
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: "HKD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Compact Home/KPI display: HK$950, HK$420K, HK$4.2M. Full amount stays on `formatOpportunityMoney`. */
export function formatOpportunityMoneyCompact(value: OpportunityMoneyAmount | string | undefined): string {
  const n = parseOpportunityMoney(value);
  if (n == null) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs < 10_000) {
    return `${sign}HK$${Math.round(abs).toLocaleString("en-HK")}`;
  }
  if (abs < 1_000_000) {
    const thousands = abs / 1000;
    const text = Number.isInteger(thousands) ? String(thousands) : thousands.toFixed(1).replace(/\.0$/, "");
    return `${sign}HK$${text}K`;
  }
  const millions = abs / 1_000_000;
  const text = millions >= 10 && Number.isInteger(millions) ? String(millions) : millions.toFixed(1).replace(/\.0$/, "");
  return `${sign}HK$${text}M`;
}

export function summariseWonOpportunityFinancials(
  rows: Array<Pick<Opportunity, "id" | "status" | "commission_income" | "related_costs" | "net_profit">>,
): WonOpportunityFinancialsSummary {
  const won = rows.filter((row) => isWonOpportunityStatus(row.status));
  const per_opportunity = won.map((row) => {
    const financials = opportunityFinancials(row);
    return {
      id: row.id,
      ...financials,
      realised: true as const,
    };
  });
  return {
    opp_count: won.length,
    commission_income: per_opportunity.reduce((sum, row) => sum + (row.commission_income ?? 0), 0),
    related_costs: per_opportunity.reduce((sum, row) => sum + (row.related_costs ?? 0), 0),
    net_profit: per_opportunity.reduce((sum, row) => sum + (row.net_profit ?? 0), 0),
    per_opportunity,
  };
}

export function summariseEstimatedPipelineFinancials(
  rows: Array<Pick<Opportunity, "status" | "commission_income" | "related_costs" | "net_profit">>,
): OpportunityFinancials & { opp_count: number } {
  const open = rows.filter((row) => row.status !== "closed_won" && row.status !== "closed_lost");
  let commission_income: OpportunityMoneyAmount = null;
  let related_costs: OpportunityMoneyAmount = null;
  for (const row of open) {
    const financials = opportunityFinancials(row);
    if (financials.commission_income != null) {
      commission_income = (commission_income ?? 0) + financials.commission_income;
    }
    if (financials.related_costs != null) {
      related_costs = (related_costs ?? 0) + financials.related_costs;
    }
  }
  return {
    opp_count: open.length,
    commission_income,
    related_costs,
    net_profit: opportunityNetProfit(commission_income, related_costs),
  };
}
