import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { formatAreaSqft } from "@/lib/formatCurrency";
import type { Opportunity, OpportunityStatus } from "@/lib/types/entities";

export type OpportunitiesQuickFilters = {
  status: string;
  lead_type: string;
};

export const EMPTY_OPPORTUNITIES_QUICK_FILTERS: OpportunitiesQuickFilters = {
  status: "",
  lead_type: "",
};

export function opportunityMatchesQuickFilters(
  row: Opportunity,
  filters: OpportunitiesQuickFilters,
): boolean {
  if (filters.status && row.status !== filters.status) return false;
  if (filters.lead_type && row.lead_type !== filters.lead_type) return false;
  return true;
}

export type OpportunitiesDashboardStage = "open" | "viewing" | "won_month";

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
