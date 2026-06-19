import { OPPORTUNITY_STATUSES } from "@/lib/lookups";
import { formatAreaSqft } from "@/lib/formatCurrency";
import { OPPORTUNITY_FUNDING_STATUSES, OPPORTUNITY_SALES_ROLES } from "@/lib/opportunityValues";
import type {
  Opportunity,
  OpportunityFundingStatus,
  OpportunitySalesRole,
  OpportunityStatus,
} from "@/lib/types/entities";

export function parseOpportunityStatus(v: string): OpportunityStatus {
  return (OPPORTUNITY_STATUSES as readonly string[]).includes(v) ? (v as OpportunityStatus) : "new";
}

export function parseOpportunitySalesRole(v: FormDataEntryValue | null): OpportunitySalesRole {
  const s = String(v ?? "").trim();
  return (OPPORTUNITY_SALES_ROLES as readonly string[]).includes(s) ? (s as OpportunitySalesRole) : "to_lease";
}

export function parseOpportunityFundingStatus(v: FormDataEntryValue | null): OpportunityFundingStatus | null {
  const s = String(v ?? "").trim();
  return (OPPORTUNITY_FUNDING_STATUSES as readonly string[]).includes(s)
    ? (s as OpportunityFundingStatus)
    : null;
}

export function opportunityPropertyType(
  opportunity: Pick<Opportunity, "property_type" | "workspace_type">,
): string | null {
  return opportunity.property_type?.trim() || opportunity.workspace_type?.trim() || null;
}

export function opportunityBudgetValue(
  opportunity: Pick<Opportunity, "budget_max" | "budget_min">,
): string | null {
  return opportunity.budget_max?.trim() || opportunity.budget_min?.trim() || null;
}

export function formatOpportunityBudget(
  max: string | null,
  legacyMin?: string | null,
): string {
  const raw = max?.trim() || legacyMin?.trim();
  if (!raw) return "—";
  const formatted = formatAreaSqft(raw);
  if (formatted === "—") return formatted;
  return `HKD ${formatted}`;
}
