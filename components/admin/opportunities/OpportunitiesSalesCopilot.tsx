"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import type { Opportunity } from "@/lib/types/entities";

type Insight = {
  row: Opportunity;
  score: number;
  label: string;
  detail: string;
};

const DAY_MS = 86_400_000;

function daysSince(value: string | null | undefined, now: number): number | null {
  if (!value) return null;
  const parsed = Date.parse(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round((now - parsed) / DAY_MS)) : null;
}

function insightFor(row: Opportunity, now: number): Insight | null {
  if (row.status === "closed_won" || row.status === "closed_lost") return null;
  if (!row.activity_count || !row.last_activity_date) {
    return { row, score: 100, label: "No footprint yet", detail: "No call, meeting, introduction, viewing or proposal has been recorded." };
  }
  const quietDays = daysSince(row.last_activity_date, now);
  if (quietDays != null && quietDays >= 30) {
    return {
      row,
      score: 70 + quietDays,
      label: `${quietDays} days quiet`,
      detail: `Last meaningful footprint: ${row.last_activity_type ?? "Activity"} on ${row.last_activity_date.slice(0, 10)}.`,
    };
  }
  return null;
}

export function OpportunitiesSalesCopilot({ rows }: { rows: Opportunity[] }) {
  const [now] = useState(() => Date.now());
  const insights = useMemo(() => rows.flatMap((row) => {
    const insight = insightFor(row, now);
    return insight ? [insight] : [];
  }).sort((a, b) => b.score - a.score).slice(0, 3), [now, rows]);

  if (insights.length === 0) return null;

  return (
    <div
      aria-label="Activity insight"
      className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto"
    >
      <span className="hidden shrink-0 items-center gap-1 text-[11px] font-semibold text-violet-800 sm:flex">
        <span aria-hidden="true">✦</span>
        Activity insight
      </span>
      {insights.map((item) => (
        <Link
          key={item.row.id}
          href={opportunityWorkspaceHref(item.row, "timeline")}
          title={item.detail}
          className="inline-flex min-w-0 max-w-[22rem] items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50/70 px-2 py-1 hover:border-violet-300 hover:bg-white"
        >
          <span className="truncate text-[11px] font-semibold text-slate-800">{item.row.client_name}</span>
          <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-px text-[10px] font-semibold text-amber-800">
            {item.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
