import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { normalizeOpportunityStatus } from "@/lib/opportunityStatusModel";
import { formatMoney, formatAreaSqft } from "@/lib/formatCurrency";
import type { Opportunity, OpportunityStatus } from "@/lib/types/entities";

export type OpportunitiesListStatusFilter = "active" | "all" | "won" | "lost" | "closed";

export const OPPORTUNITIES_LIST_STATUS_FILTERS: OpportunitiesListStatusFilter[] = [
  "active",
  "all",
  "won",
  "lost",
  "closed",
];

export const OPPORTUNITIES_LIST_STATUS_FILTER_LABELS: Record<OpportunitiesListStatusFilter, string> = {
  active: "Active",
  all: "All",
  won: "Won",
  lost: "Lost",
  closed: "Closed",
};

export function isOpportunitiesListStatusFilter(value: string): value is OpportunitiesListStatusFilter {
  return (OPPORTUNITIES_LIST_STATUS_FILTERS as readonly string[]).includes(value);
}

export function opportunityMatchesListStatusFilter(
  row: Opportunity,
  filter: OpportunitiesListStatusFilter,
): boolean {
  switch (filter) {
    case "active":
      return row.status !== "closed_won" && row.status !== "closed_lost";
    case "all":
      return true;
    case "won":
      return row.status === "closed_won";
    case "lost":
      return row.status === "closed_lost";
    case "closed":
      return row.status === "closed_won" || row.status === "closed_lost";
  }
}

export function countOpportunitiesListStatusFilter(
  rows: Opportunity[],
  filter: OpportunitiesListStatusFilter,
): number {
  return rows.filter((row) => opportunityMatchesListStatusFilter(row, filter)).length;
}

export function parseOpportunitiesListParams(
  status?: string | null,
  stage?: string | null,
): {
  listStatusFilter: OpportunitiesListStatusFilter;
  legacyStatuses: OpportunityStatus[];
  dashboardStage: OpportunitiesDashboardStage | undefined;
} {
  const statusTrim = status?.trim();
  const stageTrim = stage?.trim();

  if (statusTrim === "open") {
    return { listStatusFilter: "active", legacyStatuses: [], dashboardStage: undefined };
  }

  if (statusTrim && isOpportunitiesListStatusFilter(statusTrim)) {
    const dashboardStage =
      stageTrim === "viewing" || stageTrim === "won_month" || stageTrim === "no_footprint"
        ? stageTrim
        : undefined;
    return { listStatusFilter: statusTrim, legacyStatuses: [], dashboardStage };
  }

  if (statusTrim) {
    const legacyStatuses = statusTrim
      .split(",")
      .map((s) => normalizeOpportunityStatus(s.trim()))
      .filter((s, index, arr) => arr.indexOf(s) === index);
    if (legacyStatuses.length > 0) {
      return { listStatusFilter: "all", legacyStatuses, dashboardStage: undefined };
    }
  }

  if (stageTrim === "viewing") {
    return { listStatusFilter: "active", legacyStatuses: [], dashboardStage: "viewing" };
  }

  if (stageTrim === "won_month") {
    return { listStatusFilter: "won", legacyStatuses: [], dashboardStage: "won_month" };
  }

  if (stageTrim === "no_footprint") {
    return { listStatusFilter: "active", legacyStatuses: [], dashboardStage: "no_footprint" };
  }

  if (stageTrim === "open") {
    return { listStatusFilter: "active", legacyStatuses: [], dashboardStage: undefined };
  }

  return { listStatusFilter: "active", legacyStatuses: [], dashboardStage: undefined };
}

export type OpportunitiesQuickFilters = {
  statuses: OpportunityStatus[];
};

export const EMPTY_OPPORTUNITIES_QUICK_FILTERS: OpportunitiesQuickFilters = {
  statuses: [],
};

export function opportunityMatchesQuickFilters(
  row: Opportunity,
  filters: OpportunitiesQuickFilters,
): boolean {
  if (filters.statuses.length > 0 && !filters.statuses.includes(row.status)) return false;
  return true;
}

export type OpportunitiesDashboardStage = "open" | "viewing" | "won_month" | "no_footprint";

export function opportunityMatchesDashboardStage(
  row: Opportunity & { has_viewing_premises?: boolean },
  stage: OpportunitiesDashboardStage,
): boolean {
  if (stage === "open") {
    return row.status !== "closed_won" && row.status !== "closed_lost";
  }
  if (stage === "viewing") {
    return Boolean(row.has_viewing_premises) && row.status !== "closed_won" && row.status !== "closed_lost";
  }
  if (stage === "won_month") {
    if (row.status !== "closed_won") return false;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return (row.updated_at ?? "").slice(0, 7) === month;
  }
  if (stage === "no_footprint") {
    return !row.activity_count && row.status !== "closed_won" && row.status !== "closed_lost";
  }
  return true;
}

export function opportunityMatchesGlobalSearch(row: Opportunity, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.client_name,
    row.linked_company_name,
    row.company_name,
    row.primary_contact_name,
    row.district_preference,
    row.property_type,
    row.workspace_type,
    row.sales_role,
    row.requirement_summary,
    row.remarks,
    OPPORTUNITY_STATUS_LABELS[row.status],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function formatOpportunityExpectedFee(value: string | null | undefined): string {
  if (value == null || value.trim() === "") return "—";
  const n = Number.parseFloat(value.replace(/,/g, ""));
  if (!Number.isFinite(n) || n === 0) return "—";
  return formatMoney(n);
}

export function formatOpportunityBudget(max: string | null, legacyMin?: string | null): string {
  const raw = max?.trim() || legacyMin?.trim();
  if (!raw) return "—";
  return formatAreaSqft(raw);
}

export function formatOpportunityAreaCapacity(
  area: string | null,
  capacity: number | null,
): string {
  return [area ? `${area} sq ft` : null, capacity ? `${capacity} pax` : null]
    .filter(Boolean)
    .join(" · ") || "—";
}

export function isOpportunityStatus(value: string): value is OpportunityStatus {
  return value in OPPORTUNITY_STATUS_LABELS;
}
