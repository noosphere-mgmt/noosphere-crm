import Link from "next/link";
import {
  DashboardEmpty,
  DashboardMobileList,
  DashboardSection,
  attentionRowClass,
  attentionRowTone,
} from "@/components/admin/dashboard/dashboardUi";
import { formatCount, formatDays, QuickAction, statusLabel } from "@/components/admin/dashboard/dashboardShared";
import { MobileCompactCard } from "@/components/admin/mobile/MobileCard";
import { activityHref, opportunityHref } from "@/lib/dashboardLinks";
import { formatMoney } from "@/lib/formatCurrency";
import type { DashboardData } from "@/lib/repos/dashboard";

export function DashboardMobile({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-3">
      <DashboardSection title="Quick actions" compact>
        <div className="grid grid-cols-2 gap-2">
          <QuickAction href="/admin/opportunities?new=1" label="New opp" primary compact />
          <QuickAction href="/admin/activities" label="Activity" compact />
          <QuickAction href="/admin/companies/new" label="Company" compact />
          <QuickAction href="/admin/properties/premises/new" label="Premises" compact />
        </div>
      </DashboardSection>

      <DashboardSection
        title="Attention required"
        description="Open opportunities sorted by stale follow-up. 14+ days warning · 30+ days critical."
        compact
      >
        {data.attention.length === 0 ? (
          <DashboardEmpty message="No stale opportunities. All open deals have recent follow-up." />
        ) : (
          <DashboardMobileList>
            {data.attention.map((row) => {
              const tone = attentionRowTone(row.days_since_activity);
              return (
                <MobileCompactCard key={row.opportunity_id} className={attentionRowClass(tone)}>
                  <Link href={opportunityHref(row.opportunity_id)} className="block">
                    <p className="font-semibold text-slate-900">{row.opportunity_name}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {row.company_name ?? "No company"} · {statusLabel(row.status)}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-700">
                      {formatDays(row.days_since_activity)} · {formatMoney(row.expected_fee)}
                    </p>
                  </Link>
                </MobileCompactCard>
              );
            })}
          </DashboardMobileList>
        )}
      </DashboardSection>

      <DashboardSection title="Upcoming activities" description="Next 14 days." compact>
        {data.upcoming_activities.length === 0 ? (
          <DashboardEmpty message="No upcoming activities in the next 14 days." />
        ) : (
          <DashboardMobileList>
            {data.upcoming_activities.map((row) => (
              <MobileCompactCard key={row.activity_id}>
                <Link href={activityHref(row.activity_id)} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900">{row.activity_type}</p>
                    <p className="shrink-0 text-xs tabular-nums text-slate-500">{row.activity_date}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {[row.company_name, row.contact_name].filter(Boolean).join(" · ") || "No company"}
                  </p>
                  {row.opportunity_name ? (
                    <p className="mt-0.5 text-xs text-emerald-800">{row.opportunity_name}</p>
                  ) : null}
                  {row.premises_label ? (
                    <p className="mt-0.5 truncate text-xs text-slate-500">{row.premises_label}</p>
                  ) : null}
                </Link>
              </MobileCompactCard>
            ))}
          </DashboardMobileList>
        )}
      </DashboardSection>

      <DashboardSection
        title="Revenue pipeline"
        description="Expected commission (collect − paid-out) vs confirmed fee by stage."
        compact
      >
        {data.revenue_totals.opp_count === 0 ? (
          <DashboardEmpty message="No opportunity pipeline data yet." />
        ) : (
          <DashboardMobileList>
            {data.revenue_pipeline.map((row) => (
              <MobileCompactCard key={row.bucket}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{row.label}</p>
                  <p className="text-xs text-slate-500">{formatCount(row.opp_count)} opps</p>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Expected {formatMoney(row.expected_fee)} · Confirmed {formatMoney(row.confirmed_fee)}
                </p>
              </MobileCompactCard>
            ))}
            <MobileCompactCard className="border-slate-300 bg-slate-50">
              <p className="font-semibold text-slate-900">Pipeline total</p>
              <p className="mt-1 text-xs text-slate-600">
                {formatCount(data.revenue_totals.opp_count)} opps · Expected{" "}
                {formatMoney(data.revenue_totals.expected_fee)} · Confirmed{" "}
                {formatMoney(data.revenue_totals.confirmed_fee)}
              </p>
            </MobileCompactCard>
          </DashboardMobileList>
        )}
      </DashboardSection>
    </div>
  );
}
