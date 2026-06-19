import Link from "next/link";
import {
  DashboardEmpty,
  DashboardKpiLink,
  DashboardRowLink,
  DashboardSection,
  DashboardTableWrap,
  DashboardTableFootnote,
  attentionRowClass,
  attentionRowTone,
} from "@/components/admin/dashboard/dashboardUi";
import {
  activityHref,
  companyHref,
  contactHref,
  opportunitiesHref,
  opportunityHref,
  partyHref,
  premisesHref,
} from "@/lib/dashboardLinks";
import { formatMoney } from "@/lib/formatCurrency";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import type { DashboardData } from "@/lib/repos/dashboard";
import { DASHBOARD_TABLE_LIMIT } from "@/lib/repos/dashboard";
import type { OpportunityStatus } from "@/lib/types/entities";

function formatCount(n: number): string {
  return n.toLocaleString();
}

function formatPct(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

function statusLabel(status: string): string {
  return OPPORTUNITY_STATUS_LABELS[status as OpportunityStatus] ?? status.replace(/_/g, " ");
}

function formatDays(days: number | null): string {
  if (days == null) return "No activity";
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export function DashboardV2({ data }: { data: DashboardData }) {
  const { pipeline } = data;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-4">
        {/* Section 1 – Pipeline Summary */}
        <DashboardSection
          title="Pipeline summary"
          description="Open deal counts and expected (not confirmed) commission on open opportunities."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <DashboardKpiLink
              href={opportunitiesHref({ stage: "open" })}
              label="Open opportunities"
              value={formatCount(pipeline.open_count)}
              tone="emerald"
            />
            <DashboardKpiLink
              href={opportunitiesHref({ status: "proposal_sent" })}
              label="Proposal sent"
              value={formatCount(pipeline.proposal_sent_count)}
            />
            <DashboardKpiLink
              href={opportunitiesHref({ stage: "viewing" })}
              label="Viewing"
              value={formatCount(pipeline.viewing_count)}
            />
            <DashboardKpiLink
              href={opportunitiesHref({ status: "negotiating" })}
              label="Negotiation"
              value={formatCount(pipeline.negotiation_count)}
            />
            <DashboardKpiLink
              href={opportunitiesHref({ stage: "won_month" })}
              label="Won this month"
              value={formatCount(pipeline.won_this_month_count)}
              tone="violet"
            />
            <DashboardKpiLink
              href={opportunitiesHref({ stage: "open" })}
              label="Expected Fee Pipeline"
              value={formatMoney(pipeline.expected_fee_pipeline)}
              hint="Expected collect fee − expected paid-out fee (open opps only). Not confirmed revenue."
              tone="amber"
            />
          </div>
        </DashboardSection>

        {/* Section 2 – Attention Required */}
        <DashboardSection
          title="Attention required"
          description="Open opportunities sorted by stale follow-up. 14+ days warning · 30+ days critical."
        >
          {data.attention.length === 0 ? (
            <DashboardEmpty message="No stale opportunities. All open deals have recent follow-up." />
          ) : (
            <>
            <DashboardTableWrap>
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Opportunity</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">Company</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">Last activity</th>
                  <th className="px-3 py-2 font-medium">Days</th>
                  <th className="hidden px-3 py-2 font-medium text-right lg:table-cell">Expected net fee</th>
                </tr>
              </thead>
              <tbody>
                {data.attention.map((row) => {
                  const tone = attentionRowTone(row.days_since_activity);
                  return (
                    <tr key={row.opportunity_id} className={`border-t border-slate-100 ${attentionRowClass(tone)}`}>
                      <td className="px-3 py-2">
                        <DashboardRowLink href={opportunityHref(row.opportunity_id)} className="font-medium text-slate-900">
                          {row.opportunity_name}
                        </DashboardRowLink>
                      </td>
                      <td className="hidden px-3 py-2 text-slate-600 sm:table-cell">{row.company_name ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-600">{statusLabel(row.status)}</td>
                      <td className="hidden px-3 py-2 text-slate-600 md:table-cell">
                        {row.last_activity_date ? (
                          <>
                            {row.last_activity_date}
                            {row.last_activity_type ? (
                              <span className="mt-0.5 block text-xs text-slate-500">{row.last_activity_type}</span>
                            ) : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-slate-700">{formatDays(row.days_since_activity)}</td>
                      <td className="hidden px-3 py-2 text-right tabular-nums text-slate-700 lg:table-cell">
                        {formatMoney(row.expected_fee)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DashboardTableWrap>
            <DashboardTableFootnote>
              Showing up to {DASHBOARD_TABLE_LIMIT} stalest open opportunities (14+ days since last activity).
            </DashboardTableFootnote>
            </>
          )}
        </DashboardSection>

        {/* Section 3 – Upcoming Activities */}
        <DashboardSection title="Upcoming activities" description="Next 14 days.">
          {data.upcoming_activities.length === 0 ? (
            <DashboardEmpty message="No upcoming activities in the next 14 days." />
          ) : (
            <>
            <DashboardTableWrap>
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">Company</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">Contact</th>
                  <th className="hidden px-3 py-2 font-medium lg:table-cell">Opportunity</th>
                  <th className="hidden px-3 py-2 font-medium xl:table-cell">Premises</th>
                </tr>
              </thead>
              <tbody>
                {data.upcoming_activities.map((row) => (
                  <tr key={row.activity_id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <DashboardRowLink href={activityHref(row.activity_id)} className="tabular-nums text-slate-900">
                        {row.activity_date}
                      </DashboardRowLink>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{row.activity_type}</td>
                    <td className="hidden px-3 py-2 text-slate-600 sm:table-cell">{row.company_name ?? "—"}</td>
                    <td className="hidden px-3 py-2 text-slate-600 md:table-cell">{row.contact_name ?? "—"}</td>
                    <td className="hidden px-3 py-2 lg:table-cell">
                      {row.opportunity_id ? (
                        <Link href={opportunityHref(row.opportunity_id)} className="text-emerald-800 hover:underline">
                          {row.opportunity_name ?? `#${row.opportunity_id}`}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="hidden max-w-[12rem] truncate px-3 py-2 text-slate-600 xl:table-cell">
                      {row.premises_label ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DashboardTableWrap>
            <DashboardTableFootnote>Showing next {DASHBOARD_TABLE_LIMIT} scheduled activities.</DashboardTableFootnote>
            </>
          )}
        </DashboardSection>

        {/* Section 4 – Revenue Pipeline */}
        <DashboardSection
          title="Revenue pipeline"
          description="Expected commission (collect − paid-out) vs confirmed fee by stage. Expected amounts are not booked revenue."
        >
          {data.revenue_totals.opp_count === 0 ? (
            <DashboardEmpty message="No opportunity pipeline data yet. Add opportunities and proposed premises fees to see revenue here." />
          ) : (
          <DashboardTableWrap>
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium text-right">Opps</th>
                <th className="px-3 py-2 font-medium text-right">Expected fee</th>
                <th className="px-3 py-2 font-medium text-right">Confirmed fee</th>
              </tr>
            </thead>
            <tbody>
              {data.revenue_pipeline.map((row) => (
                <tr key={row.bucket} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800">{row.label}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCount(row.opp_count)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(row.expected_fee)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(row.confirmed_fee)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                <td className="px-3 py-2 text-slate-900">Pipeline total</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCount(data.revenue_totals.opp_count)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatMoney(data.revenue_totals.expected_fee)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatMoney(data.revenue_totals.confirmed_fee)}</td>
              </tr>
            </tbody>
          </DashboardTableWrap>
          )}
        </DashboardSection>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Section 5 – Top Referrers */}
          <DashboardSection title="Top referrers" description="Opportunity parties with Referrer role.">
            <PartyPerformanceTable rows={data.top_referrers} feeLabel="Expected referral fee" empty="No referrer data yet." />
          </DashboardSection>

          {/* Section 6 – Top Agents / Co-brokers */}
          <DashboardSection title="Top agents / co-brokers" description="Agent and co-broker parties.">
            <PartyPerformanceTable rows={data.top_agents} feeLabel="Expected fee" empty="No agent or co-broker data yet." />
          </DashboardSection>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Section 7 – Most Proposed Premises */}
          <DashboardSection title="Most proposed premises" description="High-demand buildings and units.">
            {data.top_proposed_premises.length === 0 ? (
              <DashboardEmpty message="No proposed premises yet." />
            ) : (
              <>
              <DashboardTableWrap>
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Premises</th>
                    <th className="hidden px-3 py-2 font-medium sm:table-cell">Operator</th>
                    <th className="px-3 py-2 font-medium text-right">Proposals</th>
                    <th className="px-3 py-2 font-medium text-right">Viewings</th>
                    <th className="px-3 py-2 font-medium text-right">Won</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_proposed_premises.map((row) => (
                    <tr key={row.premises_id} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <DashboardRowLink href={premisesHref(row.premises_id)} className="font-medium text-slate-900">
                          {row.premises_label}
                        </DashboardRowLink>
                      </td>
                      <td className="hidden px-3 py-2 text-slate-600 sm:table-cell">{row.operator_name ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.proposal_count}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.viewing_count}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.won_count}</td>
                    </tr>
                  ))}
                </tbody>
              </DashboardTableWrap>
              <DashboardTableFootnote>Top {DASHBOARD_TABLE_LIMIT} premises by proposal count.</DashboardTableFootnote>
              </>
            )}
          </DashboardSection>

          {/* Section 8 – Operator Performance */}
          <DashboardSection title="Operator performance" description="Conversion from proposal to won.">
            {data.operator_performance.length === 0 ? (
              <DashboardEmpty message="No operator performance data yet." />
            ) : (
              <>
              <DashboardTableWrap>
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Operator</th>
                    <th className="px-3 py-2 font-medium text-right">Proposed</th>
                    <th className="px-3 py-2 font-medium text-right">Viewed</th>
                    <th className="px-3 py-2 font-medium text-right">Won</th>
                    <th className="px-3 py-2 font-medium text-right">Win rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.operator_performance.map((row) => (
                    <tr key={row.operator_name} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-900">{row.operator_name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.proposed_count}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.viewed_count}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.won_count}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatPct(row.win_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </DashboardTableWrap>
              <DashboardTableFootnote>Top {DASHBOARD_TABLE_LIMIT} operators by proposals.</DashboardTableFootnote>
              </>
            )}
          </DashboardSection>
        </div>

        {/* Section 9 – Relationship Network */}
        <DashboardSection
          title="Relationship network"
          description="Contacts who refer companies into the pipeline."
        >
          {data.relationship_network.length === 0 ? (
            <DashboardEmpty message="No relationship referrer data yet. Add Refers links under Connections." />
          ) : (
            <>
            <ul className="space-y-4">
              {data.relationship_network.map((node) => (
                <li key={node.contact_id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link
                      href={contactHref(node.contact_id)}
                      className="text-base font-semibold text-violet-900 hover:underline"
                    >
                      {node.contact_name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {node.introduced_companies} companies · {node.introduced_contacts} contacts ·{" "}
                      {node.active_opportunities} active · {node.won_opportunities} won
                    </p>
                  </div>
                  <ul className="mt-3 space-y-1 border-l-2 border-violet-200 pl-4 font-mono text-sm text-slate-700">
                    {node.companies.map((co) => (
                      <li key={co.company_id}>
                        <Link href={companyHref(co.company_id)} className="text-slate-800 hover:text-violet-800 hover:underline">
                          {co.company_name}
                        </Link>
                        <span className="ml-2 font-sans text-xs text-slate-500">
                          ({co.active_opportunities} active · {co.won_opportunities} won)
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <DashboardTableFootnote>Top {DASHBOARD_TABLE_LIMIT} referrers by active opportunities.</DashboardTableFootnote>
            </>
          )}
        </DashboardSection>
      </div>

      {/* Section 10 – Quick Actions */}
      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <DashboardSection title="Quick actions">
          <div className="flex flex-col gap-2">
            <QuickAction href="/admin/opportunities?new=1" label="New opportunity" primary />
            <QuickAction href="/admin/activities" label="New activity" />
            <QuickAction href="/admin/companies/new" label="New company" />
            <QuickAction href="/admin/contacts?new=1" label="New contact" />
            <QuickAction href="/admin/properties/premises/new" label="New premises" />
          </div>
        </DashboardSection>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Brokerage focus</p>
          <p className="mt-2 leading-relaxed">
            This dashboard surfaces follow-ups, commission pipeline, referrers, and premises conversion — not call volume or marketing leads.
          </p>
        </div>
      </aside>
    </div>
  );
}

function QuickAction({
  href,
  label,
  primary,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "rounded-xl bg-emerald-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-800"
          : "rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
      }
    >
      {label}
    </Link>
  );
}

function PartyPerformanceTable({
  rows,
  feeLabel,
  empty,
}: {
  rows: DashboardData["top_referrers"];
  feeLabel: string;
  empty: string;
}) {
  if (rows.length === 0) return <DashboardEmpty message={empty} />;

  return (
    <>
    <DashboardTableWrap>
      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th className="px-3 py-2 font-medium">Party</th>
          <th className="px-3 py-2 font-medium text-right">Active</th>
          <th className="px-3 py-2 font-medium text-right">Won</th>
          <th className="hidden px-3 py-2 font-medium text-right sm:table-cell">Expected</th>
          <th className="hidden px-3 py-2 font-medium text-right md:table-cell">Collected</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.company_id}-${row.contact_id ?? "c"}`} className="border-t border-slate-100">
            <td className="px-3 py-2">
              <DashboardRowLink
                href={partyHref(row.company_id, row.contact_id)}
                className="font-medium text-slate-900"
              >
                {row.party_name}
              </DashboardRowLink>
            </td>
            <td className="px-3 py-2 text-right tabular-nums">{row.active_opps}</td>
            <td className="px-3 py-2 text-right tabular-nums">{row.won_opps}</td>
            <td className="hidden px-3 py-2 text-right tabular-nums sm:table-cell" title={feeLabel}>
              {formatMoney(row.expected_fee)}
            </td>
            <td className="hidden px-3 py-2 text-right tabular-nums md:table-cell">
              {formatMoney(row.collected_fee)}
            </td>
          </tr>
        ))}
      </tbody>
    </DashboardTableWrap>
    <DashboardTableFootnote>Top {DASHBOARD_TABLE_LIMIT} by active opportunities.</DashboardTableFootnote>
    </>
  );
}
