import Link from "next/link";
import type { ReactNode } from "react";

export function DashboardSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className ?? ""}`}>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function DashboardTableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

export function DashboardEmpty({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-slate-500">{message}</p>;
}

export function DashboardKpiLink({
  href,
  label,
  value,
  hint,
  tone = "slate",
}: {
  href: string;
  label: string;
  value: string;
  /** Short helper under the value (e.g. fee formula). */
  hint?: string;
  tone?: "slate" | "emerald" | "amber" | "violet";
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
      className={`block rounded-xl border px-4 py-3 transition ${toneClass}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-slate-500">{hint}</p> : null}
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
