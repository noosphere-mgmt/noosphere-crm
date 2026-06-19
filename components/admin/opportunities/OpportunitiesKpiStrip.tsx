"use client";

import type { Opportunity } from "@/lib/types/entities";

function isOpen(status: Opportunity["status"]): boolean {
  return status !== "closed_won" && status !== "closed_lost";
}

function monthKey(dateText: string | null | undefined): string | null {
  if (!dateText) return null;
  // dateText is typically ISO string; take YYYY-MM
  return dateText.slice(0, 7);
}

function kpiCard(label: string, value: string, tone?: "emerald" | "slate") {
  const toneClass =
    tone === "emerald"
      ? "border-[#A7F3D0] bg-[#ECFDF5]"
      : "border-slate-200 bg-white";
  return (
    <div className={`rounded-lg border ${toneClass} px-4 py-3`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

export function OpportunitiesKpiStrip({ rows }: { rows: Opportunity[] }) {
  const openCount = rows.filter((r) => isOpen(r.status)).length;
  const activeProposals = rows.filter((r) => r.status === "proposal_preparing" || r.status === "proposal_sent").length;
  const negotiating = rows.filter((r) => r.status === "negotiating").length;

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const wonThisMonth = rows.filter((r) => r.status === "closed_won" && monthKey(r.updated_at) === thisMonth).length;

  // Viewings is not currently modeled as a status in this schema; keep as 0 for now.
  const viewings = 0;

  return (
    <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {kpiCard("Open opportunities", String(openCount), "emerald")}
      {kpiCard("Active proposals", String(activeProposals))}
      {kpiCard("Viewings", String(viewings))}
      {kpiCard("Negotiation", String(negotiating))}
      {kpiCard("Won this month", String(wonThisMonth))}
    </div>
  );
}

