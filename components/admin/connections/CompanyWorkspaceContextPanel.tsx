"use client";

import Link from "next/link";
import { formatActivityDate, formatActivityNotesPreview } from "@/lib/activitiesDisplay";
import { opportunityDetailHref } from "@/lib/opportunityDetailNav";
import { companyWorkspaceHref } from "@/lib/companyWorkspaceNav";
import type { CompanyDrawerData } from "@/lib/repos/connectionsDrawer";
import type { CompanyFeeDealRow } from "@/lib/repos/connectionOpportunities";

function ContextSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-100 px-4 py-3 last:border-b-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function CompanyWorkspaceContextPanel({
  data,
  feeRows,
}: {
  data: CompanyDrawerData;
  feeRows: CompanyFeeDealRow[];
}) {
  const { company, opportunities, crmSummary, timeline } = data;
  const recentDeals = opportunities.slice(0, 4);
  const recentActivities = timeline.slice(0, 5);
  const openFeeLines = feeRows.filter((r) => (r.collect_fee_status ?? "expected") === "expected").length;

  return (
    <div className="flex h-full flex-col text-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Relationship context</h2>
        <p className="mt-0.5 text-xs text-slate-500">Opportunities, supply, fees, and activity</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ContextSection title="Open opportunities">
          {recentDeals.length === 0 ? (
            <p className="text-xs text-slate-500">No linked deals.</p>
          ) : (
            <ul className="space-y-2">
              {recentDeals.map((row) => (
                <li key={row.id}>
                  <Link
                    href={opportunityDetailHref(row.id, "overview")}
                    className="font-medium text-violet-900 hover:underline"
                  >
                    {row.client_name}
                  </Link>
                  <p className="text-xs text-slate-500">{row.role_label}</p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={companyWorkspaceHref(company, "deals")}
            className="mt-2 inline-block text-xs font-medium text-violet-800 hover:underline"
          >
            All deals →
          </Link>
        </ContextSection>
        <ContextSection title="Supply">
          <p className="text-xs text-slate-600">
            {crmSummary.premises} premises · {crmSummary.properties} buildings
          </p>
          <Link
            href={companyWorkspaceHref(company, "supply")}
            className="mt-2 inline-block text-xs font-medium text-blue-800 hover:underline"
          >
            View supply →
          </Link>
        </ContextSection>
        <ContextSection title="Fees">
          <p className="text-xs text-slate-600">
            {feeRows.length} party line{feeRows.length === 1 ? "" : "s"}
            {openFeeLines > 0 ? ` · ${openFeeLines} expected` : ""}
          </p>
          <Link
            href={companyWorkspaceHref(company, "fees")}
            className="mt-2 inline-block text-xs font-medium text-slate-700 hover:underline"
          >
            Fee detail →
          </Link>
        </ContextSection>
        <ContextSection title="Recent activity">
          {recentActivities.length === 0 ? (
            <p className="text-xs text-slate-500">No activities logged.</p>
          ) : (
            <ul className="space-y-2">
              {recentActivities.map((a) => (
                <li key={a.id} className="text-xs">
                  <p className="font-medium text-slate-800">{a.activity_type}</p>
                  <p className="text-slate-500">{formatActivityDate(a)}</p>
                  {a.subject || a.notes ? (
                    <p className="mt-0.5 line-clamp-2 text-slate-600">
                      {a.subject ?? formatActivityNotesPreview(a.notes)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </ContextSection>
      </div>
      <div className="border-t border-slate-200 px-4 py-3">
        <p className="text-xs text-slate-400">
          Referral tracking reserved for a future phase. Party roles on deals remain extensible.
        </p>
      </div>
    </div>
  );
}
