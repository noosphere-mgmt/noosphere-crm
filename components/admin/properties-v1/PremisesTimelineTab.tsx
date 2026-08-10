"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EntityActivitiesTab } from "@/components/admin/activities/EntityActivitiesTab";
import { buildPremisesTimelineEvents } from "@/lib/premisesTimelineEvents";
import { opportunityDetailHref } from "@/lib/opportunityDetailNav";
import { formatPremisesName } from "@/lib/premisesDisplay";
import type { PremisesDrawerData } from "@/lib/repos/premisesDrawer";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

function eventIcon(kind: string): string {
  if (kind === "shortlisted") return "★";
  if (kind === "shortlist_status") return "◆";
  return "●";
}

export function PremisesTimelineTab({
  premises,
  buildingName,
  drawerData,
}: {
  premises: PremisesV1;
  buildingName: string | null;
  drawerData: PremisesDrawerData;
}) {
  const events = useMemo(
    () => buildPremisesTimelineEvents(drawerData.activities, drawerData.proposed),
    [drawerData.activities, drawerData.proposed],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start">
      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Meaningful activity</h2>
            <p className="mt-1 text-xs text-slate-500">Completed activities and opportunity footprints for this premises.</p>
          </div>
        </div>
        {events.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No activity footprint yet. Use Record Activity to add the first meaningful footprint.
          </p>
        ) : (
          <ol className="relative space-y-0 border-l-2 border-slate-200 pl-4">
            {events.map((ev) => (
              <li key={ev.id} className="relative pb-6 last:pb-0">
                <span
                  className="absolute -left-[1.35rem] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] ring-2 ring-slate-200"
                  aria-hidden
                >
                  {eventIcon(ev.kind)}
                </span>
                <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{ev.title}</p>
                    <time className="text-xs tabular-nums text-slate-500">{ev.date || "—"}</time>
                  </div>
                  {ev.detail ? (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{ev.detail}</p>
                  ) : null}
                  {ev.opportunityId && ev.kind !== "activity" ? (
                    <Link
                      href={opportunityDetailHref(ev.opportunityId, "proposed")}
                      className="mt-1 inline-block text-xs font-medium text-violet-800 hover:underline"
                    >
                      View opportunity
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 lg:sticky lg:top-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Record activity</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">Add a completed call, meeting, introduction, inspection or other meaningful footprint.</p>
        <EntityActivitiesTab
          activities={drawerData.activities}
          showList={false}
          formPresentation="inline"
          alwaysShowForm
          defaults={{
            premises_business_id: premises.business_id ?? null,
            premises_label: formatPremisesName(buildingName, premises.floor, premises.unit),
          }}
        />
      </section>
    </div>
  );
}
