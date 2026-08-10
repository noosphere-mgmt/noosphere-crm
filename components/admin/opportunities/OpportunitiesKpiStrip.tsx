"use client";

import Link from "next/link";
import type { Opportunity } from "@/lib/types/entities";

function isOpen(status: Opportunity["status"]): boolean {
  return status !== "closed_won" && status !== "closed_lost";
}

function monthKey(dateText: string | null | undefined): string | null {
  if (!dateText) return null;
  // dateText is typically ISO string; take YYYY-MM
  return dateText.slice(0, 7);
}

function kpiCard(label: string, value: string, href: string, tone?: "emerald" | "slate", hint?: string) {
  const toneClass =
    tone === "emerald"
      ? "border-[#A7F3D0] bg-[#ECFDF5]"
      : "border-slate-200 bg-white";
  return (
    <Link href={href} className={`group rounded-lg border ${toneClass} px-4 py-3 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-xl font-semibold tracking-tight text-slate-900">{value}</p>
        <span aria-hidden="true" className="text-sm text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600">→</span>
      </div>
      {hint ? <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p> : null}
    </Link>
  );
}

export function OpportunitiesKpiStrip({ rows }: { rows: Opportunity[] }) {
  const openCount = rows.filter((r) => isOpen(r.status)).length;
  const activeProposals = rows.filter((r) =>
    r.status === "proposal_reviewing",
  ).length;
  const negotiating = rows.filter((r) => r.status === "negotiating").length;

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const wonThisMonth = rows.filter((r) => r.status === "closed_won" && monthKey(r.updated_at) === thisMonth).length;

  const viewings = rows.filter((r) => isOpen(r.status) && r.has_viewing_premises).length;
  const withoutFootprint = rows.filter((r) => isOpen(r.status) && !r.activity_count).length;

  return (
    <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {kpiCard("Without footprint", String(withoutFootprint), "/admin/opportunities?status=active&stage=no_footprint", "emerald", openCount ? `Across ${openCount} active opportunities` : "No active opportunities")}
      {kpiCard("Active proposals", String(activeProposals), "/admin/opportunities?status=proposal_reviewing")}
      {kpiCard("Viewing pipeline", String(viewings), "/admin/opportunities?status=active&stage=viewing")}
      {kpiCard("Negotiation", String(negotiating), "/admin/opportunities?status=negotiating")}
      {kpiCard("Won this month", String(wonThisMonth), "/admin/opportunities?status=won&stage=won_month")}
    </div>
  );
}
