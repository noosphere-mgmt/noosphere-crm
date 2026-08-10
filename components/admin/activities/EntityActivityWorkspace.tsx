"use client";

import { EntityActivitiesTab } from "@/components/admin/activities/EntityActivitiesTab";
import { asArray } from "@/lib/asArray";
import { formatActivityDate } from "@/lib/activitiesDisplay";
import type { ActivityListRow } from "@/lib/repos/activities";
import type { ActivityFormDefaults } from "@/components/admin/activities/ActivityFormDrawer";

function activityIcon(type: string): string {
  const value = type.toLowerCase();
  if (value.includes("call")) return "☎";
  if (value.includes("meeting")) return "●";
  if (value.includes("email")) return "✉";
  if (value.includes("view") || value.includes("inspect")) return "◆";
  if (value.includes("introduc")) return "↗";
  return "●";
}

export function EntityActivityWorkspace({
  activities,
  defaults,
  description = "Completed calls, meetings, introductions, inspections and other meaningful footprints.",
}: {
  activities: ActivityListRow[];
  defaults?: ActivityFormDefaults;
  description?: string;
}) {
  const rows = asArray<ActivityListRow>(activities);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start">
      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Meaningful activity</h2>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No activity footprint yet. Use Record Activity to add the first meaningful footprint.
          </p>
        ) : (
          <ol className="relative space-y-0 pl-9">
            <span className="absolute bottom-2 left-3 top-2 w-0.5 bg-slate-200" aria-hidden />
            {rows.map((row) => (
              <li key={row.activity_id} className="relative pb-6 last:pb-0">
                <span
                  className="absolute -left-9 top-0.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs ring-2 ring-slate-200"
                  aria-hidden
                >
                  {activityIcon(row.activity_type)}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{row.subject?.trim() || row.activity_type}</p>
                    <time className="text-xs tabular-nums text-slate-500">{formatActivityDate(row)}</time>
                  </div>
                  {row.owner?.trim() ? <p className="mt-0.5 text-xs font-medium text-slate-500">{row.owner}</p> : null}
                  {row.notes?.trim() ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{row.notes}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 lg:sticky lg:top-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Record activity</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Add a completed call, meeting, introduction, inspection or other meaningful footprint.
        </p>
        <EntityActivitiesTab
          activities={rows}
          showList={false}
          formPresentation="inline"
          alwaysShowForm
          defaults={defaults}
        />
      </section>
    </div>
  );
}
