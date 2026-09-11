"use client";

import { useEffect, useState } from "react";
import { IconSparkle } from "@/components/admin/dashboard/dashboardIcons";
import type { DashboardInsights } from "@/lib/dashboardInsights";

const CARD_TONES: Record<keyof DashboardInsights, string> = {
  priority: "border-rose-100 bg-gradient-to-br from-rose-50 to-orange-50",
  pipeline: "border-sky-100 bg-gradient-to-br from-sky-50 to-violet-50",
  channel: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50",
};

const LABEL_TONES: Record<keyof DashboardInsights, string> = {
  priority: "text-rose-700",
  pipeline: "text-violet-700",
  channel: "text-emerald-700",
};

/**
 * Compact rule-based insight strip. Ask AI opens the future Copilot drawer.
 * No model is configured in this phase.
 */
export function DashboardAiInsights({ insights }: { insights: DashboardInsights }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const cards = [insights.priority, insights.pipeline, insights.channel] as const;

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <section className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/80 via-white to-sky-50/70 px-2.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.05)] lg:px-3">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
              <IconSparkle className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight text-slate-900">AI Insights</h2>
              <p className="text-[11px] leading-tight text-slate-500">Key movements from your CRM data</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800"
          >
            <IconSparkle className="h-3 w-3" />
            Ask AI
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {cards.map((card) => {
            const isExpanded = expanded === card.kind;
            return (
              <article
                key={card.kind}
                className={`min-w-0 cursor-pointer rounded-xl border px-1.5 py-1.5 sm:px-2.5 ${CARD_TONES[card.kind]}`}
                onClick={() => setExpanded(isExpanded ? null : card.kind)}
              >
                <p className={`text-[9px] font-bold uppercase leading-tight tracking-wide sm:text-[10px] ${LABEL_TONES[card.kind]}`}>
                  {card.label}
                </p>
                <p
                  className={`mt-0.5 text-[11px] leading-snug text-slate-700 sm:text-[12px] ${
                    isExpanded ? "" : "line-clamp-3 lg:line-clamp-2"
                  }`}
                >
                  {card.text}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/20"
            aria-label="Close AI Copilot"
            onClick={() => setOpen(false)}
          />
          <aside
            className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl sm:w-[38vw] sm:min-w-[22rem] sm:max-w-[40rem]"
            role="dialog"
            aria-labelledby="dashboard-copilot-drawer-title"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <IconSparkle className="h-4 w-4" />
                </span>
                <h2 id="dashboard-copilot-drawer-title" className="text-sm font-semibold text-slate-900">
                  AI Copilot
                </h2>
              </div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="px-4 py-4 text-sm leading-relaxed text-slate-600">
              AI Copilot is not configured yet.
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
