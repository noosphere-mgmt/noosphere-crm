import { DashboardAiInsights } from "@/components/admin/dashboard/DashboardAiInsights";
import { DashboardBusinessPulse } from "@/components/admin/dashboard/DashboardBusinessPulse";
import { DashboardPipelineBubbleChart } from "@/components/admin/dashboard/DashboardPipelineBubbleChart";
import { ReferralPerformanceView } from "@/components/admin/dashboard/ReferralPerformanceView";
import type { DashboardViewData } from "@/components/admin/dashboard/DashboardV2";
import { buildDashboardInsights } from "@/lib/dashboardInsights";
import { buildPipelineOpportunityPoints } from "@/lib/dashboardPipelineStages";
import { buildDashboardPulseMetrics } from "@/lib/dashboardPulse";
import { summariseEstimatedPipelineFinancials } from "@/lib/opportunityFinancials";

export function DashboardDesktop({
  data,
}: {
  data: DashboardViewData;
  ownerName?: string;
}) {
  const { dashboard, deals } = data;
  const pipelineFinancials = summariseEstimatedPipelineFinancials(deals);
  const pulse = buildDashboardPulseMetrics(deals);
  const points = buildPipelineOpportunityPoints(deals);
  const insights = buildDashboardInsights(deals, dashboard.top_referrers);
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-2.5">
      <header className="flex min-w-0 items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase leading-none tracking-[0.16em] text-violet-600">AI-POWERED CRM</p>
          <h1 className="mt-0.5 text-base font-semibold leading-none tracking-tight text-slate-900 sm:text-lg">
            Noosphere Intelligence
          </h1>
          <p className="mt-0.5 whitespace-nowrap text-[11px] leading-none text-slate-500 sm:text-xs">
            Turns relationships into opportunities.
          </p>
        </div>
        <p className="shrink-0 text-[10px] font-medium text-slate-400 sm:text-xs sm:text-slate-500">{today}</p>
      </header>

      <DashboardAiInsights insights={insights} />

      <div className="grid w-full min-h-0 min-w-0 max-w-full items-stretch gap-2 lg:grid-cols-[minmax(0,27fr)_minmax(0,46fr)_minmax(0,27fr)] lg:gap-2.5">
        <DashboardBusinessPulse pulse={pulse} />
        <DashboardPipelineBubbleChart points={points} pipelineValue={pipelineFinancials.commission_income ?? 0} />
        <section className="flex min-h-0 min-w-0 max-w-full flex-col rounded-2xl border border-slate-200/80 bg-white px-2.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.05)] lg:px-3 lg:py-2.5">
          <h2 className="mb-1.5 text-sm font-semibold tracking-tight text-slate-900 lg:mb-2">Referral Performance</h2>
          <ReferralPerformanceView opportunityReferrers={dashboard.top_referrers.slice(0, 5)} />
        </section>
      </div>
    </div>
  );
}
