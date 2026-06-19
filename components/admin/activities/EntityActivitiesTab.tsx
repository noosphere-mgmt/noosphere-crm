"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ActivityFormDrawer,
  type ActivityFormDefaults,
} from "@/components/admin/activities/ActivityFormDrawer";
import { MobileQuickActivityBar } from "@/components/admin/activities/MobileQuickActivityBar";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import {
  formatActivityDate,
  formatActivityNotesPreview,
  formatActivityPremisesListCell,
} from "@/lib/activitiesDisplay";
import type { ActivityListRow } from "@/lib/repos/activities";
import { useIsMobile } from "@/lib/useIsMobile";

export function EntityActivitiesTab({
  activities,
  defaults,
  newActivityHref,
}: {
  activities: ActivityListRow[];
  defaults?: ActivityFormDefaults;
  newActivityHref?: string;
}) {
  const theme = moduleAccentClasses("activities");
  const router = useRouter();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityListRow | null>(null);
  const [viewing, setViewing] = useState<ActivityListRow | null>(null);
  const [createType, setCreateType] = useState<string | undefined>();

  function openCreate(type?: string) {
    setEditing(null);
    setViewing(null);
    setCreateType(type);
    setDrawerOpen(true);
  }

  const drawerDefaults = useMemo(
    () => ({
      ...defaults,
      activity_type: editing?.activity_type ?? createType ?? defaults?.activity_type,
    }),
    [defaults, editing, createType],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => openCreate()} className={theme.primaryButton}>
          + New activity
        </button>
        {newActivityHref ? (
          <Link href={newActivityHref} className={`text-sm ${theme.link}`}>
            Open in Activities
          </Link>
        ) : null}
      </div>

      {isMobile ? <MobileQuickActivityBar onSelectType={(t) => openCreate(t)} defaults={defaults} /> : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="hidden px-3 py-2 font-medium md:table-cell">Company</th>
              <th className="hidden px-3 py-2 font-medium lg:table-cell">Contact</th>
              <th className="hidden px-3 py-2 font-medium lg:table-cell">Opportunity</th>
              <th className="hidden px-3 py-2 font-medium xl:table-cell">Premises</th>
              <th className="min-w-[12rem] px-3 py-2 font-medium">Notes</th>
              <th className="w-20 px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No activities recorded yet.
                </td>
              </tr>
            ) : (
              activities.map((row) => (
                <tr key={row.activity_id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2 text-slate-700">{formatActivityDate(row)}</td>
                  <td className="px-3 py-2 text-slate-900">{row.activity_type}</td>
                  <td className="hidden px-3 py-2 text-slate-700 md:table-cell">{row.company_name ?? "—"}</td>
                  <td className="hidden px-3 py-2 text-slate-700 lg:table-cell">{row.contact_name ?? "—"}</td>
                  <td className="hidden px-3 py-2 text-slate-700 lg:table-cell">{row.opportunity_name ?? "—"}</td>
                  <td className="hidden px-3 py-2 text-slate-700 xl:table-cell">
                    {formatActivityPremisesListCell(row.premises_label)}
                  </td>
                  <td className="max-w-xs px-3 py-2 text-slate-600">
                    <p className="line-clamp-2 text-xs leading-snug">{formatActivityNotesPreview(row.notes)}</p>
                  </td>
                  <td className="px-3 py-2">
                    <ModuleRowActions
                      module="activities"
                      onView={() => setViewing(row)}
                      onEdit={() => {
                        setEditing(row);
                        setDrawerOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewing ? (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-slate-900/10" onClick={() => setViewing(null)} aria-label="Close" />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">{viewing.activity_type}</p>
                <h3 className="text-lg font-semibold text-slate-900">{formatActivityDate(viewing)}</h3>
              </div>
              <button type="button" onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-700">
                ×
              </button>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              {viewing.company_name ? (
                <div>
                  <dt className="text-xs text-slate-500">Company</dt>
                  <dd>{viewing.company_name}</dd>
                </div>
              ) : null}
              {viewing.contact_name ? (
                <div>
                  <dt className="text-xs text-slate-500">Contact</dt>
                  <dd>{viewing.contact_name}</dd>
                </div>
              ) : null}
              {viewing.opportunity_name ? (
                <div>
                  <dt className="text-xs text-slate-500">Opportunity</dt>
                  <dd>{viewing.opportunity_name}</dd>
                </div>
              ) : null}
              {viewing.premises_label ? (
                <div>
                  <dt className="text-xs text-slate-500">Premises</dt>
                  <dd>{viewing.premises_label}</dd>
                </div>
              ) : null}
              {viewing.notes?.trim() ? (
                <div>
                  <dt className="text-xs text-slate-500">Notes</dt>
                  <dd className="whitespace-pre-wrap">{viewing.notes}</dd>
                </div>
              ) : null}
            </dl>
            <button
              type="button"
              className="mt-4 text-sm font-medium text-amber-800 hover:underline"
              onClick={() => {
                setEditing(viewing);
                setViewing(null);
                setDrawerOpen(true);
              }}
            >
              Edit activity
            </button>
          </aside>
        </>
      ) : null}

      <ActivityFormDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
          setCreateType(undefined);
        }}
        activity={editing}
        defaults={drawerDefaults}
        onSaved={() => {
          setDrawerOpen(false);
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}
