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
    <section className="mb-3 rounded-xl border border-violet-200 bg-violet-50/50 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="flex shrink-0 items-center gap-2">
          <span aria-hidden="true" className="text-violet-600">✦</span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Activity insight</h2>
            <p className="text-[11px] text-slate-500">Based only on recorded footprints</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap gap-2 lg:flex-nowrap">
          {insights.map((item) => (
            <Link key={item.row.id} href={opportunityWorkspaceHref(item.row, "timeline")}
              className="group min-w-[220px] flex-1 rounded-lg border border-white bg-white px-3 py-2 shadow-sm hover:border-violet-300">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-semibold text-slate-900 group-hover:text-violet-700">{item.row.client_name}</p>
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{item.label}</span>
              </div>
              <p className="mt-1 truncate text-[11px] text-slate-500" title={item.detail}>{item.detail}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
