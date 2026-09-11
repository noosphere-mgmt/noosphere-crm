import Link from "next/link";
import type { DashboardReferrerPerformanceRow } from "@/lib/repos/dashboard";
import { referrerPerformanceHref } from "@/lib/dashboardLinks";
import { formatCount } from "@/components/admin/dashboard/dashboardShared";

const rankingColours = [
  { bar: "bg-amber-100", badge: "bg-amber-200 text-amber-950", count: "text-amber-800" },
  { bar: "bg-emerald-100", badge: "bg-emerald-200 text-emerald-900", count: "text-emerald-800" },
  { bar: "bg-sky-100", badge: "bg-sky-200 text-sky-900", count: "text-sky-800" },
  { bar: "bg-violet-100", badge: "bg-violet-200 text-violet-900", count: "text-violet-800" },
  { bar: "bg-rose-100", badge: "bg-rose-200 text-rose-900", count: "text-rose-800" },
];

export function ReferralPerformanceView({
  opportunityReferrers,
}: {
  opportunityReferrers: DashboardReferrerPerformanceRow[];
}) {
  const rows = opportunityReferrers.slice(0, 5);
  const maximum = Math.max(...rows.map((row) => row.total_opps), 1);

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        Link a referring party to an opportunity to begin measuring channel performance.
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ol className="flex-1 space-y-1.5">
        {rows.map((row, index) => {
          const colour = rankingColours[index] ?? rankingColours[rankingColours.length - 1];
          const width = Math.max((row.total_opps / maximum) * 100, 14);
          return (
            <li key={row.entity_key}>
              <Link
                href={referrerPerformanceHref(row)}
                className="group relative flex min-h-9 flex-nowrap items-center gap-1.5 overflow-hidden rounded-xl border border-slate-100 bg-white px-2 py-1.5 transition hover:border-slate-200 hover:shadow-sm sm:min-h-10 sm:gap-2 sm:px-2.5"
              >
                <span className={`absolute inset-y-0 left-0 ${colour.bar} transition-all group-hover:opacity-80`} style={{ width: `${width}%` }} />
                <span className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${colour.badge}`}>
                  {index + 1}
                </span>
                <span className="relative min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-900" title={row.party_name}>{row.party_name}</span>
                <span className="relative flex min-w-0 shrink-0 items-center gap-1 whitespace-nowrap text-[10px] tabular-nums sm:gap-1 sm:text-[11px]">
                  <strong className={`rounded-full bg-white px-1.5 py-0.5 sm:px-2 ${colour.count}`}>{formatCount(row.total_opps)}</strong>
                  <span className="rounded-full bg-white/90 px-1.5 py-0.5 font-medium text-slate-600 sm:px-2">
                    {formatCount(row.active_opps)} active
                  </span>
                  <span className="rounded-full bg-white/90 px-1.5 py-0.5 font-medium text-slate-600 sm:px-2">
                    {formatCount(row.won_opps)} won
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <Link href="/admin/connections/channel-tree" className="mt-2 block text-center text-[12px] font-semibold text-violet-700 hover:text-violet-900">
        Explore full channel tree →
      </Link>
    </div>
  );
}
