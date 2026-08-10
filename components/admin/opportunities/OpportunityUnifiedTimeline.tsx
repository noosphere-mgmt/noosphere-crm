"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EntityActivitiesTab } from "@/components/admin/activities/EntityActivitiesTab";
import { buildUnifiedTimelineEvents } from "@/lib/opportunityTimelineEvents";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import { resolveCompanySelectValue, resolveContactSelectValue } from "@/lib/crmSelectOptions";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

function eventIcon(kind: string): string {
  if (kind === "proposal_sent") return "📤";
  if (kind === "proposal_created") return "📄";
  if (kind === "status_change") return "↻";
  return "◆";
}

export function OpportunityUnifiedTimeline({ data }: { data: OpportunityDetailData }) {
  const events = useMemo(
    () => buildUnifiedTimelineEvents(data.activities, data.proposals),
    [data.activities, data.proposals],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start">
      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Meaningful activity</h2>
            <p className="mt-1 text-xs text-slate-500">Completed calls, meetings, introductions, viewings and proposal footprints.</p>
          </div>
        </div>

        {events.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No activity footprint yet. Use Record Activity to add the first meaningful footprint.
          </p>
        ) : (
          <ol className="relative space-y-0 pl-9">
            <span className="absolute bottom-2 left-3 top-2 w-0.5 bg-slate-200" aria-hidden />
            {events.map((ev) => (
              <li key={ev.id} className="relative pb-6 last:pb-0">
                <span
                  className="absolute -left-9 top-0.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs ring-2 ring-slate-200"
                  aria-hidden
                >
                  {eventIcon(ev.kind)}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{ev.title}</p>
                    <time className="text-xs tabular-nums text-slate-500">{ev.date || "—"}</time>
                  </div>
                  {ev.staff ? (
                    <p className="mt-0.5 text-xs font-medium text-slate-500">{ev.staff}</p>
                  ) : null}
                  {ev.detail ? (
                    <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{ev.detail}</p>
                  ) : null}
                  {ev.kind.startsWith("proposal") && ev.proposalId ? (
                    <Link
                      href={`${opportunityWorkspaceHref(data.opportunity, "documents")}&proposal=${ev.proposalId}`}
                      className="mt-2 inline-block text-xs font-medium text-emerald-800 hover:underline"
                    >
                      View in documents
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
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Add a completed call, meeting, introduction, viewing or other meaningful footprint.
        </p>
        <EntityActivitiesTab
          activities={data.activities}
          showList={false}
          formPresentation="inline"
          alwaysShowForm
          defaults={{
            opportunity_business_id: data.opportunity.business_id ?? null,
            opportunity_name: data.opportunity.client_name,
            company_business_id: resolveCompanySelectValue(data.companies, data.opportunity.company_id) || null,
            company_name: data.opportunity.linked_company_name,
            contact_business_id: resolveContactSelectValue(data.contacts, data.opportunity.primary_contact_id) || null,
            contact_name: data.opportunity.primary_contact_name,
          }}
        />
      </section>
    </div>
  );
}
