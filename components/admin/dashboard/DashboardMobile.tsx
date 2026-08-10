import Link from "next/link";
import {
  DashboardEmpty,
  DashboardKpiLink,
  DashboardMobileList,
  DashboardSection,
  attentionRowClass,
  attentionRowTone,
} from "@/components/admin/dashboard/dashboardUi";
import { formatCount, formatDays, statusLabel } from "@/components/admin/dashboard/dashboardShared";
import type { DashboardViewData } from "@/components/admin/dashboard/DashboardV2";
import {
  contactHref,
  dealWorkspaceHref,
  opportunitiesHref,
  referrerPerformanceHref,
} from "@/lib/dashboardLinks";
import {
  countDealsByPipelineStage,
  countOpenDeals,
  DASHBOARD_PIPELINE_STAGES,
  pipelineStageHref,
} from "@/lib/dashboardPipelineStages";
import { MobileCompactCard } from "@/components/admin/mobile/MobileCard";
import { OPPORTUNITY_STATUS_PROBABILITY } from "@/lib/lookups";

export function DashboardMobile({ data }: { data: DashboardViewData }) {
  const { dashboard, deals } = data;
  const openDeals = deals.filter((deal) => !["closed_won", "closed_lost"].includes(deal.status));
  const scores = openDeals.map((deal) => OPPORTUNITY_STATUS_PROBABILITY[deal.status]).filter((score): score is number => score != null);
  const averageScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const nearClosing = deals.filter((deal) => deal.status === "negotiating").length;
  const won = deals.filter((deal) => deal.status === "closed_won").length;
  const lost = deals.filter((deal) => deal.status === "closed_lost").length;
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">AI-powered CRM</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Noosphere Intelligence</h1>
        <p className="mt-1 text-xs text-slate-500">Turn relationships, property intelligence and opportunities into action.</p>
      </div>

      <section>
        <div className="mb-2 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Business pulse</h2>
            <p className="text-[11px] text-slate-500">Live opportunity intelligence</p>
          </div>
          <Link href="/admin/opportunities" className="text-xs font-semibold text-emerald-700">View all</Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link href={opportunitiesHref({ status: "open" })} className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-700">Avg score</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-950">{averageScore}%</p>
            <p className="text-[10px] text-emerald-700">{formatCount(countOpenDeals(deals))} open</p>
          </Link>
          <Link href={opportunitiesHref({ status: "negotiating" })} className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wide text-sky-700">Near closing</p>
            <p className="mt-1 text-2xl font-semibold text-sky-950">{formatCount(nearClosing)}</p>
            <p className="text-[10px] text-sky-700">Active late stages</p>
          </Link>
          <Link href={opportunitiesHref({ status: "closed_won" })} className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wide text-violet-700">Win rate</p>
            <p className="mt-1 text-2xl font-semibold text-violet-950">{winRate}%</p>
            <p className="text-[10px] text-violet-700">{won} won · {lost} lost</p>
          </Link>
          <Link href={opportunitiesHref({ status: "open" })} className="rounded-xl border border-rose-100 bg-gradient-to-br from-amber-50 to-rose-50 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wide text-rose-700">Attention</p>
            <p className="mt-1 text-2xl font-semibold text-rose-950">{formatCount(dashboard.attention.length)}</p>
            <p className="text-[10px] text-rose-700">Follow-up required</p>
          </Link>
        </div>
      </section>

      <DashboardSection title="Referral movement" compact>
        {dashboard.top_referrers.length === 0 && dashboard.relationship_network.length === 0 ? (
          <DashboardEmpty message="Add referrers and introductions to build the channel view." />
        ) : (
          <DashboardMobileList>
            {dashboard.top_referrers.slice(0, 2).map((row) => (
              <MobileCompactCard key={row.entity_key}>
                <Link href={referrerPerformanceHref(row)} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-semibold text-slate-900">{row.party_name}</span>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">{formatCount(row.active_opps)} active</span>
                </Link>
              </MobileCompactCard>
            ))}
            {dashboard.relationship_network.slice(0, 2).map((node) => (
              <MobileCompactCard key={`network-top-${node.contact_id}`}>
                <Link href={contactHref(node.contact_id)} className="block">
                  <p className="font-semibold text-slate-900">{node.contact_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatCount(node.introduced_companies)} companies · {formatCount(node.introduced_contacts)} contacts introduced</p>
                </Link>
              </MobileCompactCard>
            ))}
          </DashboardMobileList>
        )}
      </DashboardSection>

      <DashboardSection title="Follow up now" compact>
        {dashboard.attention.length === 0 ? (
          <DashboardEmpty message="No stale deals." />
        ) : (
          <DashboardMobileList>
            {dashboard.attention.map((row) => {
              const tone = attentionRowTone(row.days_since_activity);
              return (
                <MobileCompactCard key={row.opportunity_id} className={attentionRowClass(tone)}>
                  <Link href={dealWorkspaceHref({ id: row.opportunity_id })} className="block">
                    <p className="font-semibold text-slate-900">{row.opportunity_name}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {statusLabel(row.status)} · {formatDays(row.days_since_activity)}
                    </p>
                  </Link>
                </MobileCompactCard>
              );
            })}
          </DashboardMobileList>
        )}
      </DashboardSection>

      <DashboardSection title="Pipeline" compact>
        <div className="grid grid-cols-2 gap-2">
          {DASHBOARD_PIPELINE_STAGES.map((stage) => (
            <DashboardKpiLink
              key={stage.id}
              href={pipelineStageHref(stage)}
              label={stage.label}
              value={formatCount(countDealsByPipelineStage(deals, stage))}
              compact
            />
          ))}
        </div>
      </DashboardSection>

    </div>
  );
}
