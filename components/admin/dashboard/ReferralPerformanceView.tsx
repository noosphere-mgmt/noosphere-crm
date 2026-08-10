import Link from "next/link";
import type { DashboardReferrerPerformanceRow } from "@/lib/repos/dashboard";
import { referrerPerformanceHref } from "@/lib/dashboardLinks";
import { formatCount } from "@/components/admin/dashboard/dashboardShared";

const rankingColours = [
  { bar: "bg-amber-200/70", badge: "bg-amber-300 text-amber-950", count: "text-amber-800" },
  { bar: "bg-emerald-100", badge: "bg-emerald-200 text-emerald-900", count: "text-emerald-700" },
  { bar: "bg-sky-100", badge: "bg-sky-200 text-sky-900", count: "text-sky-700" },
  { bar: "bg-violet-100", badge: "bg-violet-200 text-violet-900", count: "text-violet-700" },
  { bar: "bg-rose-100", badge: "bg-rose-200 text-rose-900", count: "text-rose-700" },
];

export function ReferralPerformanceView({
  opportunityReferrers,
}: {
  opportunityReferrers: DashboardReferrerPerformanceRow[];
}) {
  const rows = opportunityReferrers.slice(0, 5);
  const maximum = Math.max(...rows.map((row) => row.total_opps), 1);

  if (rows.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Link a referring party to an opportunity to begin measuring channel performance.</p>;
  }

  return (
    <div className="flex h-full flex-col">
      <ol className="flex-1 space-y-2">
        {rows.map((row, index) => {
          const colour = rankingColours[index] ?? rankingColours[rankingColours.length - 1];
          const width = Math.max((row.total_opps / maximum) * 100, 12);
          return (
            <li key={row.entity_key}>
              <Link
                href={referrerPerformanceHref(row)}
                className="group relative flex min-h-10 items-center gap-2 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2 transition hover:border-slate-200 hover:shadow-sm"
              >
                <span className={`absolute inset-y-0 left-0 ${colour.bar} transition-all group-hover:opacity-80`} style={{ width: `${width}%` }} />
                <span className={`relative flex h-6 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${colour.badge}`}>{index + 1}</span>
                <span className="relative min-w-0 flex-1 truncate text-xs font-semibold text-slate-900">{row.party_name}</span>
                <span className="relative flex shrink-0 items-center gap-1 text-[10px] tabular-nums">
                  <strong className={`rounded-full bg-white/90 px-2 py-1 text-xs ${colour.count}`}>{formatCount(row.total_opps)}</strong>
                  <span className="hidden rounded-full bg-white/75 px-1.5 py-1 text-slate-600 min-[390px]:inline">{formatCount(row.active_opps)} active</span>
                  <span className="hidden rounded-full bg-white/75 px-1.5 py-1 text-slate-600 sm:inline">{formatCount(row.won_opps)} won</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <Link href="/admin/connections/channel-tree" className="mt-3 block text-center text-[10px] font-semibold text-violet-700 hover:text-violet-900">
        Explore full channel tree →
      </Link>
    </div>
  );
}
