"use client";

import Link from "next/link";
import { formatActivityDate, formatActivityNotesPreview } from "@/lib/activitiesDisplay";
import {
  OPPORTUNITY_QUICK_LINKS,
  collectPendingItems,
} from "@/lib/opportunityWorkspaceDesk";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

function ContextBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-5 py-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function OpportunityWorkspaceContextPanel({
  data,
  proposalsEnabled,
}: {
  data: OpportunityDetailData;
  proposalsEnabled: boolean;
}) {
  const { opportunity, activities } = data;
  const pendingItems = collectPendingItems(data, proposalsEnabled);
  const recentMovement = activities.slice(0, 3);
  const quickLinks = OPPORTUNITY_QUICK_LINKS(opportunity, proposalsEnabled);

  return (
    <div className="flex h-full flex-col text-sm">
      <div className="px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Opportunity insight</h2>
        <p className="mt-1 text-xs text-slate-500">Grounded in current CRM records</p>
      </div>

      <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
        <ContextBlock title="Footprint">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-violet-50 px-3 py-2">
              <p className="text-lg font-semibold text-violet-900">{activities.length}</p>
              <p className="text-[11px] text-violet-700">Activities</p>
            </div>
            <div className="rounded-lg bg-emerald-50 px-3 py-2">
              <p className="text-lg font-semibold text-emerald-900">{data.proposedPremises.length}</p>
              <p className="text-[11px] text-emerald-700">Proposed</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Last activity: {data.lastActivityDate?.slice(0, 10) ?? "No footprint recorded"}</p>
        </ContextBlock>

        {pendingItems.length > 0 ? (
          <ContextBlock title="Data attention">
            <ul className="space-y-2">
              {pendingItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </ContextBlock>
        ) : null}

        <ContextBlock title="Recent activity">
          {recentMovement.length === 0 ? (
            <p className="text-sm text-slate-500">No meaningful activity recorded</p>
          ) : (
            <ul className="space-y-3">
              {recentMovement.map((activity) => (
                <li key={activity.id} className="text-xs">
                  <p className="font-medium text-slate-800">{activity.activity_type}</p>
                  <p className="text-slate-500">{formatActivityDate(activity)}</p>
                  {activity.subject || activity.notes ? (
                    <p className="mt-0.5 line-clamp-2 text-slate-600">
                      {activity.subject ?? formatActivityNotesPreview(activity.notes)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </ContextBlock>

        <ContextBlock title="Jump to">
          <ul className="grid grid-cols-2 gap-2">
            {quickLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="block rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </ContextBlock>
      </div>
    </div>
  );
}
