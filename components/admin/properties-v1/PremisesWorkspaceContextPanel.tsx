"use client";

import Link from "next/link";
import { formatActivityDate, formatActivityNotesPreview } from "@/lib/activitiesDisplay";
import { opportunityDetailHref } from "@/lib/opportunityDetailNav";
import { normalizeProposedPremisesStatus, PROPOSED_PREMISES_STATUS_LABELS } from "@/lib/opportunityValues";
import { formatProposedPremisesProposedPrice } from "@/lib/proposedPremisesDisplay";
import { premisesWorkspaceHref } from "@/lib/premisesWorkspaceNav";
import type { PremisesDrawerData } from "@/lib/repos/premisesDrawer";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

function ContextSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-100 px-4 py-3 last:border-b-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function PremisesWorkspaceContextPanel({
  premises,
  drawerData,
  returnTo,
}: {
  premises: PremisesV1;
  drawerData: PremisesDrawerData;
  returnTo: string;
}) {
  const linkedDeals = drawerData.proposed.slice(0, 5);
  const recentActivities = drawerData.activities.slice(0, 5);
  const activeDeal = linkedDeals[0] ?? null;

  return (
    <div className="flex h-full flex-col text-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Supply context</h2>
        <p className="mt-0.5 text-xs text-slate-500">Linked opportunities and recent activity</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ContextSection title="Linked opportunities">
          {linkedDeals.length === 0 ? (
            <p className="text-xs text-slate-500">Not linked to any opportunity yet.</p>
          ) : (
            <ul className="space-y-2">
              {linkedDeals.map((row) => {
                const href = opportunityDetailHref(row.opportunity_id, "proposed");
                return (
                  <li key={row.id} className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                    <Link href={href} className="font-medium text-violet-900 hover:underline">
                      {row.opportunity_client_name ?? `Opportunity #${row.opportunity_id}`}
                    </Link>
                    <p className="text-xs text-slate-600">
                      {PROPOSED_PREMISES_STATUS_LABELS[normalizeProposedPremisesStatus(row.status)]}
                      {row.proposed_price ? ` · ${formatProposedPremisesProposedPrice(row)}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href={premisesWorkspaceHref(premises, "deals", undefined, returnTo)}
            className="mt-2 inline-block text-xs font-medium text-blue-800 hover:underline"
          >
            View all opportunities →
          </Link>
        </ContextSection>

        {activeDeal ? (
          <ContextSection title="Related opportunity">
            <p className="text-sm font-medium text-slate-900">
              {activeDeal.opportunity_client_name ?? `Opportunity #${activeDeal.opportunity_id}`}
            </p>
            {activeDeal.opportunity_company_name ? (
              <p className="text-xs text-slate-600">{activeDeal.opportunity_company_name}</p>
            ) : null}
            {activeDeal.opportunity_district ? (
              <p className="mt-1 text-xs text-slate-500">{activeDeal.opportunity_district.split(/[,;/|]/)[0]}</p>
            ) : null}
            <Link
              href={opportunityDetailHref(activeDeal.opportunity_id, "proposed")}
              className="mt-2 inline-block text-xs font-medium text-violet-800 hover:underline"
            >
              Open opportunity workspace →
            </Link>
          </ContextSection>
        ) : null}

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
          <Link
            href={premisesWorkspaceHref(premises, "activities", undefined, returnTo)}
            className="mt-2 inline-block text-xs font-medium text-slate-700 hover:underline"
          >
            Open activity →
          </Link>
        </ContextSection>
      </div>

      <div className="border-t border-slate-200 px-4 py-3">
        <p className="text-xs text-slate-400">
          Assist (AI) is disabled until R4. Context panel shows live supply data only.
        </p>
      </div>
    </div>
  );
}
