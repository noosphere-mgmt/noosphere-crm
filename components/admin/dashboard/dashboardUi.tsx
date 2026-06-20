import Link from "next/link";
import type { ReactNode } from "react";

export function DashboardSection({
  title,
  description,
  children,
  className,
  compact,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Hide description on phone screens. */
  compact?: boolean;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5 ${className ?? ""}`}>
      <div className="mb-3 md:mb-4">
        <h2 className="text-sm font-semibold text-slate-900 md:text-base">{title}</h2>
        {description ? (
          <p className={`mt-1 text-sm text-slate-600 ${compact ? "hidden md:block" : ""}`}>{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function DashboardTableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto md:-mx-1">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

export function DashboardMobileList({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

export function DashboardEmpty({ message }: { message: string }) {
  return <p className="py-4 text-center text-sm text-slate-500 md:py-6">{message}</p>;
}

export function DashboardKpiLink({
  href,
  label,
  value,
  hint,
  tone = "slate",
  compact,
}: {
  href: string;
  label: string;
  value: string;
  hint?: string;
  tone?: "slate" | "emerald" | "amber" | "violet";
  compact?: boolean;
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 hover:border-amber-300"
        : tone === "violet"
          ? "border-violet-200 bg-violet-50 hover:border-violet-300"
          : "border-slate-200 bg-white hover:border-slate-300";

  return (
    <Link
      href={href}
      className={`block rounded-lg border px-3 py-2 transition md:rounded-xl md:px-4 md:py-3 ${toneClass}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 md:text-xs">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight text-slate-900 md:mt-1 md:text-xl">{value}</p>
      {hint && !compact ? <p className="mt-1 hidden text-[11px] leading-snug text-slate-500 md:block">{hint}</p> : null}
    </Link>
  );
}

export function DashboardTableFootnote({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-xs text-slate-500">{children}</p>;
}

export function DashboardRowLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`block transition hover:bg-slate-50 ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}

export function attentionRowTone(days: number | null): "critical" | "warning" | "normal" {
  if (days == null) return "critical";
  if (days >= 30) return "critical";
  if (days >= 14) return "warning";
  return "normal";
}

export function attentionRowClass(tone: ReturnType<typeof attentionRowTone>): string {
  if (tone === "critical") return "bg-red-50/80";
  if (tone === "warning") return "bg-amber-50/60";
  return "";
}
