import type { PipelineOpportunityPoint } from "@/lib/dashboardPipelineStages";

export const PIPELINE_CHART_SIZE = { width: 680, height: 292 };
export const PIPELINE_CHART_PAD = { left: 68, right: 12, top: 16, bottom: 44 };
export const PIPELINE_UNSCHEDULED_BAND = 72;
export const PIPELINE_MONTH_LABEL_SIZE = 17;
export const PIPELINE_PERCENT_LABEL_SIZE = 17;

export type LaidPipelineBubble = PipelineOpportunityPoint & {
  x: number;
  y: number;
  r: number;
  scheduled: boolean;
  showLabel: boolean;
};

export type PipelineChartLayout = {
  bubbles: LaidPipelineBubble[];
  gridX: { label: string; x: number }[];
  gridY: { label: string; y: number; value: number }[];
  unscheduledCount: number;
  hasUnscheduledBand: boolean;
  plotLeft: number;
};

function parseDateOnly(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

const MONTH_TICKS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function formatMonthTick(date: Date): string {
  const year = String(date.getFullYear()).slice(-2);
  return `${MONTH_TICKS[date.getMonth()]} ${year}`;
}

function chanceY(chance: number | null, plotTop: number, plotH: number): number {
  const pct = Math.min(100, Math.max(0, chance ?? 0));
  return plotTop + plotH - (pct / 100) * plotH;
}

function bubbleRadius(value: number, maxValue: number): number {
  const minR = 11;
  const maxR = 30;
  if (maxValue <= 0) return minR;
  return minR + Math.sqrt(Math.max(0, value) / maxValue) * (maxR - minR);
}

/** SVG layout for one bubble per active opportunity. Dates are never invented. */
export function layoutPipelineOpportunityChart(
  points: PipelineOpportunityPoint[],
  now = new Date(),
  minMonths = 6,
): PipelineChartLayout {
  const { width, height } = PIPELINE_CHART_SIZE;
  const pad = PIPELINE_CHART_PAD;
  const plotH = height - pad.top - pad.bottom;
  const scheduledDates = points
    .map((point) => parseDateOnly(point.expectedClose))
    .filter((date): date is Date => date != null);
  const unscheduledCount = points.length - scheduledDates.length;
  const hasUnscheduledBand = unscheduledCount > 0;
  const plotLeft = pad.left + (hasUnscheduledBand ? PIPELINE_UNSCHEDULED_BAND : 0);
  const plotW = Math.max(40, width - plotLeft - pad.right);

  const minDate = scheduledDates.length
    ? monthStart(new Date(Math.min(...scheduledDates.map((date) => date.getTime()))))
    : monthStart(now);
  let maxDate = scheduledDates.length
    ? monthStart(new Date(Math.max(...scheduledDates.map((date) => date.getTime()))))
    : addMonths(monthStart(now), Math.max(0, minMonths - 1));
  const monthSpan = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth());
  if (scheduledDates.length && monthSpan < minMonths - 1) {
    maxDate = addMonths(minDate, minMonths - 1);
  }

  const maxT = addMonths(maxDate, 1).getTime();
  const months: Date[] = [];
  for (let cursor = new Date(minDate); cursor.getTime() < maxT; cursor = addMonths(cursor, 1)) {
    months.push(new Date(cursor));
  }
  const slotW = plotW / Math.max(1, months.length);
  const xForDate = (date: Date) => {
    const index = (date.getFullYear() - minDate.getFullYear()) * 12 + (date.getMonth() - minDate.getMonth());
    const slot = Math.min(months.length - 1, Math.max(0, index));
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const dayFraction = (Math.min(daysInMonth, Math.max(1, date.getDate())) - 0.5) / daysInMonth;
    return plotLeft + (slot + dayFraction) * slotW;
  };
  const maxValue = Math.max(0, ...points.map((point) => point.value));

  const unscheduledByChance = new Map<number, number>();
  const dateKeyCounts = new Map<string, number>();

  const bubbles: LaidPipelineBubble[] = points.map((point) => {
    const closeDate = parseDateOnly(point.expectedClose);
    const scheduled = closeDate != null;
    const r = bubbleRadius(point.value, maxValue);
    const rawY = chanceY(point.chance, pad.top, plotH);
    const y = Math.min(pad.top + plotH - r - 1, Math.max(pad.top + r + 1, rawY));
    let x: number;
    if (!scheduled) {
      const chanceKey = point.chance ?? -1;
      const index = unscheduledByChance.get(chanceKey) ?? 0;
      unscheduledByChance.set(chanceKey, index + 1);
      const bandCenter = pad.left + PIPELINE_UNSCHEDULED_BAND / 2;
      x = bandCenter + (index - 0.5) * Math.min(14, r * 0.45);
    } else {
      const key = `${point.expectedClose}-${point.chance ?? "na"}`;
      const index = dateKeyCounts.get(key) ?? 0;
      dateKeyCounts.set(key, index + 1);
      x = xForDate(closeDate);
      if (index > 0) x += (index % 2 === 0 ? 1 : -1) * Math.min(12, 6 + index * 3);
    }
    return {
      ...point,
      x,
      y,
      r,
      scheduled,
      showLabel: r >= 20,
    };
  });

  const gridY = [0, 25, 50, 75, 100].map((value) => ({
    value,
    label: `${value}%`,
    y: chanceY(value, pad.top, plotH),
  }));

  const gridX: { label: string; x: number }[] = [];
  const unscheduledLabelX = pad.left + PIPELINE_UNSCHEDULED_BAND / 2;
  if (hasUnscheduledBand) {
    gridX.push({ label: "No date", x: unscheduledLabelX });
  }
  for (let index = 0; index < months.length; index += 1) {
    const month = months[index];
    if (!month) continue;
    gridX.push({
      label: formatMonthTick(month),
      x: plotLeft + (index + 0.5) * slotW,
    });
  }

  return { bubbles, gridX, gridY, unscheduledCount, hasUnscheduledBand, plotLeft };
}
