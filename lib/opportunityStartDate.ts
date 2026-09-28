/**
 * Start Date is when work should begin. NULL or on/before today means the
 * opportunity is already active. A later date stays in the CRM but is not
 * current pipeline until that calendar day.
 */

export type OpportunityStartWindow = "active" | "next_3_months" | "next_6_months" | "all";

export const OPPORTUNITY_START_WINDOWS: OpportunityStartWindow[] = [
  "active",
  "next_3_months",
  "next_6_months",
  "all",
];

export const OPPORTUNITY_START_WINDOW_LABELS: Record<OpportunityStartWindow, string> = {
  active: "Active",
  next_3_months: "Next 3-Mth",
  next_6_months: "Next 6-Mth",
  all: "All",
};

export type OpportunityPrimaryFilter = OpportunityStartWindow | "won" | "lost";

export const OPPORTUNITY_PRIMARY_FILTERS: OpportunityPrimaryFilter[] = [
  "active",
  "next_3_months",
  "next_6_months",
  "all",
  "won",
  "lost",
];

export const OPPORTUNITY_PRIMARY_FILTER_LABELS: Record<OpportunityPrimaryFilter, string> = {
  ...OPPORTUNITY_START_WINDOW_LABELS,
  won: "Won",
  lost: "Lost",
};

export function currentPipelineStartSql(alias = "o"): string {
  return `(${alias}.start_date IS NULL OR ${alias}.start_date <= CURRENT_DATE)`;
}

export function opportunityStartDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

export function todayDateString(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Add calendar months, clamping month-end overflow (31 Jan + 1 month → 28/29 Feb). */
export function addCalendarMonths(dateText: string, months: number): string {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const originalDay = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() !== originalDay) date.setDate(0);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** NULL and dates on or before today are active. Later dates are future. */
export function isActiveOpportunityStart(
  startDate: string | null | undefined,
  today = todayDateString(),
): boolean {
  const date = opportunityStartDate(startDate);
  if (!date) return true;
  return date <= today;
}

export function isOpportunityStartWindow(value: string | null | undefined): value is OpportunityStartWindow {
  return (OPPORTUNITY_START_WINDOWS as readonly string[]).includes(value ?? "");
}

export function parseOpportunityStartWindow(value: string | null | undefined): OpportunityStartWindow {
  return isOpportunityStartWindow(value) ? value : "active";
}

/**
 * Active is based on Start Date. Forecast windows are based on Expected Close Date.
 * Next 3 / Next 6 include only future close dates through that calendar-month horizon.
 * An opportunity inside 3 months also matches the 6-month window.
 */
export function opportunityMatchesDateWindow(
  opportunity: {
    start_date?: string | null;
    expected_close_date?: string | null;
  },
  window: OpportunityStartWindow,
  today = todayDateString(),
): boolean {
  if (window === "all") return true;
  if (window === "active") return isActiveOpportunityStart(opportunity.start_date, today);
  const date = opportunityStartDate(opportunity.expected_close_date);
  if (!date || date <= today) return false;
  const months = window === "next_3_months" ? 3 : 6;
  return date <= addCalendarMonths(today, months);
}

export type PipelineChartHorizon = "next_3_months" | "next_6_months" | "all";

/** Bubble chart horizons use Expected Close Date. All keeps the current pipeline. */
export function pipelinePointInHorizon(
  point: { expectedClose?: string | null },
  horizon: PipelineChartHorizon,
  today = todayDateString(),
): boolean {
  if (horizon === "all") return true;
  return opportunityMatchesDateWindow(
    { expected_close_date: point.expectedClose },
    horizon,
    today,
  );
}
