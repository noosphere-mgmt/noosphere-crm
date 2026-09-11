import Link from "next/link";
import { formatCount } from "@/components/admin/dashboard/dashboardShared";
import { opportunitiesHref } from "@/lib/dashboardLinks";
import type { DashboardPulseMetrics } from "@/lib/dashboardPulse";
import { formatOpportunityMoney, formatOpportunityMoneyCompact } from "@/lib/opportunityFinancials";

type PulseRow = {
  label: string;
  shortLabel: string;
  value: string;
  title?: string;
  href?: string;
};

function PulseSecondaryRows({ rows, compact }: { rows: PulseRow[]; compact: boolean }) {
  return (
    <>
      {rows.map((row) => {
        const value = (
          <dd className="text-[13px] font-semibold tabular-nums text-slate-900" title={row.title}>
            {row.value}
          </dd>
        );
        return (
          <div key={row.label} className={`flex items-center justify-between gap-2 ${compact ? "py-1" : "py-1.5"}`}>
            <dt className="text-[12px] text-slate-600">{compact ? row.shortLabel : row.label}</dt>
            {row.href ? <Link href={row.href}>{value}</Link> : value}
          </div>
        );
      })}
    </>
  );
}

export function DashboardBusinessPulse({ pulse }: { pulse: DashboardPulseMetrics }) {
  const tiles = [
    {
      label: "Won Revenue",
      value: formatOpportunityMoneyCompact(pulse.won_revenue),
      hint: "Won this month",
      href: opportunitiesHref({ status: "closed_won" }),
      title: formatOpportunityMoney(pulse.won_revenue),
      tone: "from-emerald-50 to-teal-50 text-emerald-950",
    },
    {
      label: "Pipeline Value",
      value: formatOpportunityMoneyCompact(pulse.pipeline_value),
      hint: `${formatCount(pulse.active_count)} active`,
      href: opportunitiesHref({ status: "open" }),
      title: formatOpportunityMoney(pulse.pipeline_value),
      tone: "from-sky-50 to-cyan-50 text-sky-950",
    },
    {
      label: "Opportunities Won",
      value: formatCount(pulse.won_this_month),
      hint: "Closed won this month",
      href: opportunitiesHref({ status: "closed_won" }),
      tone: "from-amber-50 to-orange-50 text-amber-950",
    },
    {
      label: "Win Rate",
      value: pulse.win_rate == null ? "—" : `${pulse.win_rate}%`,
      hint: `${formatCount(pulse.won_count)} won / ${formatCount(pulse.won_count + pulse.lost_count)} closed`,
      href: opportunitiesHref({ status: "closed_won" }),
      tone: "from-violet-50 to-fuchsia-50 text-violet-950",
    },
  ];

  const rows: PulseRow[] = [
    {
      label: "Active Opportunities",
      shortLabel: "Active Opps",
      value: formatCount(pulse.active_count),
      href: opportunitiesHref({ status: "open" }),
    },
    {
      label: "Avg. Days in Pipeline",
      shortLabel: "Avg. Days",
      value: pulse.avg_days_in_pipeline == null ? "—" : formatCount(pulse.avg_days_in_pipeline),
    },
    {
      label: "Opportunities Stale (>60 days)",
      shortLabel: "Stale (>60 days)",
      value: formatCount(pulse.stale_over_60),
      href: opportunitiesHref({ status: "open" }),
    },
  ];

  return (
    <section className="flex h-full min-h-0 min-w-0 max-w-full flex-col rounded-2xl border border-slate-200/80 bg-white px-2.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.05)] lg:px-3 lg:py-2.5">
      <h2 className="mb-1.5 text-sm font-semibold tracking-tight text-slate-900 lg:mb-2">Business Pulse</h2>
      <div className="grid min-w-0 grid-cols-2 gap-1.5">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            title={tile.title}
            className={`min-w-0 rounded-xl bg-gradient-to-br px-2 py-1.5 lg:px-2.5 lg:py-2 ${tile.tone}`}
          >
            <p className="text-[11px] font-semibold leading-tight text-slate-600">{tile.label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">{tile.value}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">{tile.hint}</p>
          </Link>
        ))}
      </div>
      <details className="group mt-1 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-[12px] font-medium text-slate-600 marker:hidden [&::-webkit-details-marker]:hidden">
          More business metrics
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </summary>
        <dl className="divide-y divide-slate-100 border-t border-slate-100">
          <PulseSecondaryRows rows={rows} compact />
        </dl>
      </details>
      <dl className="mt-2 hidden divide-y divide-slate-100 border-t border-slate-100 lg:block">
        <PulseSecondaryRows rows={rows} compact={false} />
      </dl>
    </section>
  );
}
