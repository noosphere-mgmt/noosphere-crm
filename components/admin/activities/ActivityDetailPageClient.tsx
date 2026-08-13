"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ActivityFormDrawer,
  type ActivityFormDefaults,
} from "@/components/admin/activities/ActivityFormDrawer";
import { IconX } from "@/components/admin/ModuleActionIcons";
import { moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { formatActivityDate, formatActivityPremisesListCell } from "@/lib/activitiesDisplay";
import {
  activityFullPageHref,
  companyFullPageHref,
  contactFullPageHref,
  opportunityFullPageHref,
} from "@/lib/crmDetailNav";
import type { ActivityListRow } from "@/lib/repos/activities";

export function ActivityDetailPageClient({ activity }: { activity: ActivityListRow }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const editHref = activityFullPageHref(activity.business_id, { mode: "edit" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "edit") setDrawerOpen(true);
  }, []);

  const defaults: ActivityFormDefaults = {
    activity_date: activity.activity_date,
    activity_time: activity.activity_time,
    activity_type: activity.activity_type,
    notes: activity.notes,
    company_business_id: activity.company_business_id,
    company_name: activity.company_name,
    contact_business_id: activity.contact_business_id,
    contact_name: activity.contact_name,
    opportunity_business_id: activity.opportunity_business_id,
    opportunity_name: activity.opportunity_name,
    premises_business_id: activity.premises_business_id,
    premises_label: activity.premises_label,
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="min-w-0">
          <Link href="/admin/activities" className="text-xs text-amber-800 hover:underline">
            ← Activities
          </Link>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">{activity.activity_type}</h1>
          <RecordBusinessId id={activity.business_id} className="mt-0.5 block" />
          <p className="mt-1 text-sm text-slate-600">{formatActivityDate(activity)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className={moduleEditButtonClass("activities")}
            onClick={() => setDrawerOpen(true)}
            aria-label="Edit"
            title="Edit"
          >
            Edit
          </button>
          <Link href="/admin/activities" className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <IconX />
          </Link>
        </div>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">Company</dt>
            <dd className="text-sm text-slate-900">
              <AdminEntityLink href={companyFullPageHref(activity.company_business_id ?? activity.company_id)}>
                {activity.company_name}
              </AdminEntityLink>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Contact</dt>
            <dd className="text-sm text-slate-900">
              <AdminEntityLink href={contactFullPageHref(activity.contact_business_id ?? activity.contact_id)}>
                {activity.contact_name}
              </AdminEntityLink>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Opportunity</dt>
            <dd className="text-sm text-slate-900">
              <AdminEntityLink
                href={opportunityFullPageHref(activity.opportunity_business_id ?? activity.opportunity_id)}
              >
                {activity.opportunity_name}
              </AdminEntityLink>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Premises</dt>
            <dd className="text-sm text-slate-900">{formatActivityPremisesListCell(activity.premises_label)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-slate-500">Notes</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{activity.notes?.trim() || "—"}</dd>
          </div>
        </dl>
      </div>

      <ActivityFormDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          if (editHref) router.replace(activityFullPageHref(activity.business_id) ?? "/admin/activities");
        }}
        activity={activity}
        defaults={defaults}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
