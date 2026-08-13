"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ActivityFormDrawer,
  type ActivityFormDefaults,
} from "@/components/admin/activities/ActivityFormDrawer";
import { ActivityReviewDrawer } from "@/components/admin/activities/ActivityReviewDrawer";
import { MobileQuickActivityBar } from "@/components/admin/activities/MobileQuickActivityBar";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { asArray } from "@/lib/asArray";
import {
  formatActivityDate,
  formatActivityNotesPreview,
  formatActivityPremisesListCell,
} from "@/lib/activitiesDisplay";
import {
  companyFullPageHref,
  contactFullPageHref,
  opportunityFullPageHref,
} from "@/lib/crmDetailNav";
import type { ActivityListRow } from "@/lib/repos/activities";
import { useIsMobile } from "@/lib/useIsMobile";

export function EntityActivitiesTab({
  activities,
  defaults,
  newActivityHref,
  embedded = false,
  limit,
  showList = true,
  createLabel = "New",
  formPresentation = "drawer",
  alwaysShowForm = false,
}: {
  activities: ActivityListRow[];
  defaults?: ActivityFormDefaults;
  newActivityHref?: string;
  embedded?: boolean;
  limit?: number;
  showList?: boolean;
  createLabel?: string;
  formPresentation?: "drawer" | "inline";
  alwaysShowForm?: boolean;
}) {
  const theme = moduleAccentClasses("activities");
  const router = useRouter();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(alwaysShowForm);
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

  const visibleActivities = useMemo(
    () => {
      const safeActivities = asArray<ActivityListRow>(activities);
      return limit != null && limit > 0 ? safeActivities.slice(0, limit) : safeActivities;
    },
    [activities, limit],
  );

  return (
    <div className={embedded ? "space-y-2" : "space-y-4"}>
      {!alwaysShowForm ? <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => openCreate()} className={theme.primaryButton}>
          {createLabel}
        </button>
        {newActivityHref ? (
          <Link href={newActivityHref} className={`text-sm ${theme.link}`}>
            Open in Activities
          </Link>
        ) : null}
      </div> : null}

      {isMobile && !alwaysShowForm ? <MobileQuickActivityBar onSelectType={(t) => openCreate(t)} defaults={defaults} /> : null}

      {showList ? <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
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
            {visibleActivities.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No activities recorded yet.
                </td>
              </tr>
            ) : (
              visibleActivities.map((row) => (
                <tr key={row.activity_id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2 text-slate-700">{formatActivityDate(row)}</td>
                  <td className="px-3 py-2 text-slate-900">
                    <button
                      type="button"
                      onClick={() => setViewing(row)}
                      className="cursor-pointer text-left text-inherit hover:underline"
                    >
                      {row.activity_type}
                    </button>
                  </td>
                  <td className="hidden px-3 py-2 text-slate-700 md:table-cell">
                    <AdminEntityLink href={companyFullPageHref(row.company_business_id ?? row.company_id)}>
                      {row.company_name}
                    </AdminEntityLink>
                  </td>
                  <td className="hidden px-3 py-2 text-slate-700 lg:table-cell">
                    <AdminEntityLink href={contactFullPageHref(row.contact_business_id ?? row.contact_id)}>
                      {row.contact_name}
                    </AdminEntityLink>
                  </td>
                  <td className="hidden px-3 py-2 text-slate-700 lg:table-cell">
                    <AdminEntityLink href={opportunityFullPageHref(row.opportunity_business_id ?? row.opportunity_id)}>
                      {row.opportunity_name}
                    </AdminEntityLink>
                  </td>
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
      </div> : null}

      {viewing ? (
        <ActivityReviewDrawer
          activity={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
            setDrawerOpen(true);
          }}
        />
      ) : null}

      <ActivityFormDrawer
        open={drawerOpen}
        onClose={() => {
          if (!alwaysShowForm) setDrawerOpen(false);
          setEditing(null);
          setCreateType(undefined);
        }}
        activity={editing}
        defaults={drawerDefaults}
        presentation={formPresentation}
        persistent={alwaysShowForm}
        onSaved={() => {
          if (!alwaysShowForm) setDrawerOpen(false);
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}
