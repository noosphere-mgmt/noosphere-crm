import Link from "next/link";
import type { ReactNode } from "react";
import { ReferralPerformanceView } from "@/components/admin/dashboard/ReferralPerformanceView";
import { formatCount, formatDays } from "@/components/admin/dashboard/dashboardShared";
import type { DashboardViewData } from "@/components/admin/dashboard/DashboardV2";
import {
  dealWorkspaceHref,
  opportunitiesHref,
  referrerPerformanceHref,
} from "@/lib/dashboardLinks";
import {
  countDealsByPipelineStage,
  DASHBOARD_PIPELINE_STAGES,
  pipelineStageHref,
} from "@/lib/dashboardPipelineStages";
import { OPPORTUNITY_STATUS_PROBABILITY } from "@/lib/lookups";

function DashboardCard({
  title,
  description,
  viewAllHref,
  children,
}: {
  title: string;
  description?: string;
  viewAllHref?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:min-h-[20rem]">
      <div className="flex min-h-12 items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          {description ? <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{description}</p> : null}
        </div>
        {viewAllHref ? (
          <Link href={viewAllHref} className="shrink-0 text-xs font-semibold text-emerald-700 hover:text-emerald-900">
            View all
          </Link>
        ) : null}
      </div>
      <div className="mt-3 flex-1">{children}</div>
    </section>
  );
}

export function DashboardDesktop({ data }: { data: DashboardViewData }) {
  const { dashboard, deals } = data;
  const pipelineColours = ["#059669", "#14b8a6", "#38bdf8", "#818cf8", "#a78bfa", "#f59e0b", "#94a3b8"];
  const pipelineRows = DASHBOARD_PIPELINE_STAGES.map((stage, index) => ({
    stage,
    count: countDealsByPipelineStage(deals, stage),
    colour: pipelineColours[index % pipelineColours.length],
  }));
  const pipelineTotal = pipelineRows.reduce((sum, row) => sum + row.count, 0);
  const priorityOpportunity = dashboard.attention[0] ?? null;
  const busiestOpenStage = [...pipelineRows]
    .filter((row) => row.stage.id !== "closed_won")
    .sort((a, b) => b.count - a.count)[0] ?? null;
  const strongestReferrer = dashboard.top_referrers[0] ?? null;
  const openDeals = deals.filter((deal) => !["closed_won", "closed_lost"].includes(deal.status));
  const openScores = openDeals
    .map((deal) => OPPORTUNITY_STATUS_PROBABILITY[deal.status])
    .filter((score): score is number => score != null);
  const averageOpportunityScore = openScores.length
    ? Math.round(openScores.reduce((sum, score) => sum + score, 0) / openScores.length)
    : 0;
  const nearClosingCount = deals.filter((deal) => deal.status === "negotiating").length;
  const wonCount = deals.filter((deal) => deal.status === "closed_won").length;
  const lostCount = deals.filter((deal) => deal.status === "closed_lost").length;
  const winRate = wonCount + lostCount > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">AI-powered CRM</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Noosphere Intelligence</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">Turn relationships, property intelligence and opportunities into action.</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-emerald-50 shadow-sm">
        <div className="flex items-center gap-2 border-b border-violet-100 px-4 py-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-sm text-white">✦</span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">AI Copilot</h2>
            <p className="text-[11px] text-slate-500">Recommended movements from current CRM signals</p>
          </div>
        </div>
        <div className="grid divide-y divide-violet-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Link
            href={priorityOpportunity ? dealWorkspaceHref({ id: priorityOpportunity.opportunity_id }) : "/admin/leads"}
            className="group px-4 py-3 transition hover:bg-white/80"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-rose-600">Priority action</p>
            <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-slate-800 group-hover:text-violet-800">
              {priorityOpportunity
                ? `Re-engage ${priorityOpportunity.opportunity_name}; no meaningful activity for ${formatDays(priorityOpportunity.days_since_activity)}.`
                : "No overdue follow-up. Review new leads and create the next opportunity."}
            </p>
          </Link>

          <Link
            href={busiestOpenStage ? pipelineStageHref(busiestOpenStage.stage) : "/admin/opportunities"}
            className="group px-4 py-3 transition hover:bg-white/80"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-sky-600">Pipeline movement</p>
            <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-slate-800 group-hover:text-violet-800">
              {busiestOpenStage && busiestOpenStage.count > 0
                ? `${formatCount(busiestOpenStage.count)} opportunities are in ${busiestOpenStage.stage.label}. Open them and progress the strongest case.`
                : "The active pipeline is light. Qualify existing leads and add the next viable requirement."}
            </p>
          </Link>

          <Link
            href={strongestReferrer ? referrerPerformanceHref(strongestReferrer) : "/admin/connections/channel-tree"}
            className="group px-4 py-3 transition hover:bg-white/80"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Channel action</p>
            <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-slate-800 group-hover:text-violet-800">
              {strongestReferrer
                ? `${strongestReferrer.party_name} has referred ${formatCount(strongestReferrer.total_opps)} opportunities. Reconnect and ask for the next introduction.`
                : "No opportunity referrer is recorded. Reconnect with a trusted partner and request an introduction."}
            </p>
          </Link>
        </div>
      </section>

      <div className="grid items-stretch gap-3 sm:gap-4 lg:grid-cols-3">
        <DashboardCard title="Business pulse" description="Live opportunity intelligence">
          <div className="grid h-full grid-cols-2 gap-2 sm:gap-3">
            <Link href={opportunitiesHref({ status: "open" })} className="flex min-h-28 flex-col justify-between rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-3 transition hover:shadow-md sm:p-4">
              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Avg opportunity score</span>
              <strong className="mt-2 text-3xl font-semibold tabular-nums text-emerald-950">{averageOpportunityScore}%</strong>
              <span className="mt-1 text-[11px] text-emerald-700">Stage-weighted · {formatCount(openDeals.length)} open</span>
            </Link>
            <Link href={opportunitiesHref({ status: "negotiating" })} className="flex min-h-28 flex-col justify-between rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50 p-3 transition hover:shadow-md sm:p-4">
              <span className="text-[10px] font-bold uppercase tracking-wide text-sky-700">Near closing</span>
              <strong className="mt-2 text-3xl font-semibold tabular-nums text-sky-950">{formatCount(nearClosingCount)}</strong>
              <span className="mt-1 text-[11px] text-sky-700">Negotiating opportunities</span>
            </Link>
            <Link href={opportunitiesHref({ status: "closed_won" })} className="flex min-h-28 flex-col justify-between rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-3 transition hover:shadow-md sm:p-4">
              <span className="text-[10px] font-bold uppercase tracking-wide text-violet-700">Win rate</span>
              <strong className="mt-2 text-3xl font-semibold tabular-nums text-violet-950">{winRate}%</strong>
              <span className="mt-1 text-[11px] text-violet-700">{formatCount(wonCount)} won · {formatCount(lostCount)} lost</span>
            </Link>
            <Link href={opportunitiesHref({ status: "open" })} className="flex min-h-28 flex-col justify-between rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-rose-50 p-3 transition hover:shadow-md sm:p-4">
              <span className="text-[10px] font-bold uppercase tracking-wide text-rose-700">Attention needed</span>
              <strong className="mt-2 text-3xl font-semibold tabular-nums text-rose-950">{formatCount(dashboard.attention.length)}</strong>
              <span className="mt-1 text-[11px] text-rose-700">No meaningful activity for 14+ days</span>
            </Link>
          </div>
        </DashboardCard>

        <DashboardCard title="Pipeline">
          <div className="flex h-full flex-col items-center justify-center gap-1 py-1" aria-label={`${formatCount(pipelineTotal)} opportunities across the pipeline`}>
            {pipelineRows.map(({ stage, count, colour }, index) => {
              const width = 100 - index * 7;
              return (
                <Link
                  key={stage.id}
                  href={pipelineStageHref(stage)}
                  title={`${stage.label}: ${formatCount(count)}`}
                  className={`flex items-center justify-center gap-2 px-5 text-center font-semibold transition hover:brightness-105 ${
                    count === 0
                      ? "h-5 text-[10px] text-slate-500"
                      : "h-8 text-xs text-white shadow-sm"
                  }`}
                  style={{
                    width: `${width}%`,
                    backgroundColor: count === 0 ? "#e2e8f0" : colour,
                    clipPath: "polygon(4% 0, 96% 0, 100% 100%, 0 100%)",
                  }}
                >
                  <span className="truncate">{stage.label}</span>
                  <span className={`rounded-full px-1.5 py-0.5 font-bold tabular-nums ${count === 0 ? "bg-white/70" : "bg-white/25"}`}>
                    {formatCount(count)}
                  </span>
                </Link>
              );
            })}
            <p className="pt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {formatCount(pipelineTotal)} total opportunities
            </p>
          </div>
        </DashboardCard>

        <DashboardCard title="Referral performance" description="Top opportunity referrers">
          <ReferralPerformanceView
            opportunityReferrers={dashboard.top_referrers.slice(0, 5)}
          />
        </DashboardCard>

      </div>
    </div>
  );
}
