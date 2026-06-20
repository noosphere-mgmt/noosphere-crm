import Link from "next/link";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import type { OpportunityStatus } from "@/lib/types/entities";

export function formatCount(n: number): string {
  return n.toLocaleString();
}

export function formatPct(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

export function statusLabel(status: string): string {
  return OPPORTUNITY_STATUS_LABELS[status as OpportunityStatus] ?? status.replace(/_/g, " ");
}

export function formatDays(days: number | null): string {
  if (days == null) return "No activity";
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export function QuickAction({
  href,
  label,
  primary,
  compact,
}: {
  href: string;
  label: string;
  primary?: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link
        href={href}
        className={
          primary
            ? "rounded-lg bg-emerald-700 px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-800"
            : "rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
        }
      >
        {label}
      </Link>
    );
  }

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
