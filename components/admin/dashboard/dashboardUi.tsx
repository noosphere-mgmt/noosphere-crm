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
  compact?: boolean;
}) {
  return (
    <section className={`${className ?? ""}`}>
      <div className="mb-3 md:mb-4">
        <h2 className="text-base font-semibold tracking-tight text-slate-900 md:text-lg">{title}</h2>
        {description ? (
          <p className={`mt-1 text-sm text-slate-500 ${compact ? "hidden md:block" : ""}`}>{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function DashboardTableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-slate-100">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

export function DashboardMobileList({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

export function DashboardEmpty({ message }: { message: string }) {
  return (
    <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-500 ring-1 ring-slate-100">
      {message}
    </p>
  );
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
      ? "bg-emerald-50 ring-emerald-100 hover:bg-emerald-100/80"
      : tone === "amber"
        ? "bg-amber-50 ring-amber-100 hover:bg-amber-100/80"
        : tone === "violet"
          ? "bg-violet-50 ring-violet-100 hover:bg-violet-100/80"
          : "bg-white ring-slate-100 hover:bg-slate-50";

  return (
    <Link
      href={href}
      className={`block rounded-xl px-4 py-3 ring-1 transition ${toneClass}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>
      {hint && !compact ? <p className="mt-1 hidden text-xs leading-snug text-slate-500 md:block">{hint}</p> : null}
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
    <Link href={href} className={`transition hover:text-emerald-800 ${className ?? ""}`}>
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
