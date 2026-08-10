"use client";

import Link from "next/link";
import { buildOpportunityProcessInsights } from "@/lib/opportunityProcessInsights";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

const TONE_DOT = {
  neutral: "bg-slate-400",
  attention: "bg-amber-500",
  positive: "bg-emerald-500",
} as const;

export function OpportunityCurrentPosition({
  data,
  proposalsEnabled = false,
}: {
  data: OpportunityDetailData;
  proposalsEnabled?: boolean;
}) {
  const { headline, facts, insights, nextStep, recent } = buildOpportunityProcessInsights(
    data,
    proposalsEnabled,
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex shrink-0 rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800 ring-1 ring-violet-200">
            ✦ Process insight
          </span>
          {facts.length > 0 ? (
            <p className="text-[11px] text-slate-500">{facts.join(" · ")}</p>
          ) : null}
        </div>
        <p className="mt-1.5 text-sm leading-snug text-slate-800">{headline}</p>
      </div>

      <div className="space-y-3 px-3 py-2.5">
        <ul className="space-y-1.5">
          {insights.map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[item.tone]}`} aria-hidden />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Suggested next</p>
          <Link
            href={nextStep.href}
            className="mt-0.5 block text-sm font-semibold text-violet-800 hover:text-violet-950 hover:underline"
          >
            {nextStep.label}
          </Link>
          {nextStep.detail ? <p className="mt-0.5 text-[11px] text-slate-500">{nextStep.detail}</p> : null}
        </div>

        {recent.length > 0 ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Recent correspondence</p>
            <ul className="mt-1.5 divide-y divide-slate-100">
              {recent.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="block py-1.5 hover:bg-slate-50/80">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-slate-800">{item.title}</span>
                      <span className="shrink-0 text-[10px] text-slate-400">{item.date}</span>
                    </div>
                    {item.preview ? (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{item.preview}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="text-[10px] leading-snug text-slate-400">
          Based on status, proposals, properties and logged activity. Confirm before acting.
        </p>
      </div>
    </div>
  );
}
