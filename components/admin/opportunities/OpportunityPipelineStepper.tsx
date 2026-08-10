"use client";

import { OPPORTUNITY_PIPELINE_STEPS } from "@/lib/opportunityPipeline";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

export function OpportunityPipelineStepper({ activeIndex }: { activeIndex: number }) {
  const theme = moduleAccentClasses("opportunities");

  return (
    <nav aria-label="Opportunity pipeline" className="mt-3 overflow-x-auto">
      <ol className="flex min-w-max items-center gap-0">
        {OPPORTUNITY_PIPELINE_STEPS.map((step, index) => {
          const done = index < activeIndex;
          const current = index === activeIndex;
          const upcoming = index > activeIndex;
          return (
            <li key={step.id} className="flex items-center">
              <div className="flex flex-col items-center px-2 sm:px-3">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    current
                      ? `${theme.primaryButton} ring-2 ring-emerald-200 ring-offset-1`
                      : done
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-slate-100 text-slate-400"
                  }`}
                  aria-current={current ? "step" : undefined}
                >
                  {done ? "✓" : index + 1}
                </span>
                <span
                  className={`mt-1 text-[10px] font-medium uppercase tracking-wide sm:text-xs ${
                    current ? "text-emerald-900" : upcoming ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < OPPORTUNITY_PIPELINE_STEPS.length - 1 ? (
                <div
                  className={`mb-4 h-0.5 w-6 sm:w-10 ${done ? "bg-emerald-300" : "bg-slate-200"}`}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
