"use client";

import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { IconX } from "@/components/admin/ModuleActionIcons";
import { formatActivityDate } from "@/lib/activitiesDisplay";
import {
  companyFullPageHref,
  contactFullPageHref,
  opportunityFullPageHref,
} from "@/lib/crmDetailNav";
import type { ActivityListRow } from "@/lib/repos/activities";

export function ActivityReviewDrawer({
  activity,
  onClose,
  onEdit,
}: {
  activity: ActivityListRow;
  onClose: () => void;
  onEdit?: () => void;
}) {
  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-slate-900/10" onClick={onClose} aria-label="Close" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Review activity</p>
            <h3 className="mt-0.5 text-lg font-semibold text-slate-900">
              {activity.subject?.trim() || activity.activity_type}
            </h3>
            <RecordBusinessId id={activity.business_id} className="mt-0.5 block" />
            <p className="mt-1 text-sm text-slate-600">
              {activity.activity_type} · {formatActivityDate(activity)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
            title="Close"
          >
            <IconX />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <dl className="space-y-3 text-sm">
            {activity.company_name ? (
              <div>
                <dt className="text-xs text-slate-500">Company</dt>
                <dd>
                  <AdminEntityLink href={companyFullPageHref(activity.company_business_id ?? activity.company_id)}>
                    {activity.company_name}
                  </AdminEntityLink>
                </dd>
              </div>
            ) : null}
            {activity.contact_name ? (
              <div>
                <dt className="text-xs text-slate-500">Contact</dt>
                <dd>
                  <AdminEntityLink href={contactFullPageHref(activity.contact_business_id ?? activity.contact_id)}>
                    {activity.contact_name}
                  </AdminEntityLink>
                </dd>
              </div>
            ) : null}
            {activity.opportunity_name ? (
              <div>
                <dt className="text-xs text-slate-500">Opportunity</dt>
                <dd>
                  <AdminEntityLink
                    href={opportunityFullPageHref(activity.opportunity_business_id ?? activity.opportunity_id)}
                  >
                    {activity.opportunity_name}
                  </AdminEntityLink>
                </dd>
              </div>
            ) : null}
            {activity.premises_label ? (
              <div>
                <dt className="text-xs text-slate-500">Premises</dt>
                <dd>{activity.premises_label}</dd>
              </div>
            ) : null}
            {activity.owner?.trim() ? (
              <div>
                <dt className="text-xs text-slate-500">Owner</dt>
                <dd>{activity.owner}</dd>
              </div>
            ) : null}
            {activity.notes?.trim() ? (
              <div>
                <dt className="text-xs text-slate-500">Notes</dt>
                <dd className="whitespace-pre-wrap text-slate-800">{activity.notes}</dd>
              </div>
            ) : null}
          </dl>
          {onEdit ? (
            <button
              type="button"
              className="mt-5 text-sm font-medium text-amber-800 hover:underline"
              onClick={onEdit}
            >
              Edit activity
            </button>
          ) : null}
        </div>
      </aside>
    </>
  );
}
