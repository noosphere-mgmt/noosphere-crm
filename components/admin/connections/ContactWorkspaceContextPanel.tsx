"use client";

import Link from "next/link";
import { formatActivityDate, formatActivityNotesPreview } from "@/lib/activitiesDisplay";
import { companyFullPageHref } from "@/lib/crmDetailNav";
import { opportunityDetailHref } from "@/lib/opportunityDetailNav";
import { contactWorkspaceHref } from "@/lib/contactWorkspaceNav";
import type { ContactDrawerData } from "@/lib/repos/connectionsDrawer";

function ContextSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-100 px-4 py-3 last:border-b-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function ContactWorkspaceContextPanel({ data }: { data: ContactDrawerData }) {
  const { contact, opportunities, affiliations, activities } = data;
  const recentDeals = opportunities.slice(0, 4);
  const recentActivities = activities.slice(0, 5);

  return (
    <div className="flex h-full flex-col text-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Relationship context</h2>
        <p className="mt-0.5 text-xs text-slate-500">Affiliations, deals, and activity</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ContextSection title="Affiliations">
          {affiliations.length === 0 ? (
            <p className="text-xs text-slate-500">No company affiliations yet.</p>
          ) : (
            <ul className="space-y-2">
              {affiliations.slice(0, 4).map((row) => {
                const href = companyFullPageHref(row.company_business_id);
                return (
                  <li key={row.id}>
                    {href ? (
                      <Link href={href} className="font-medium text-violet-900 hover:underline">
                        {row.company_name}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-900">{row.company_name}</span>
                    )}
                    {row.job_title ? <p className="text-xs text-slate-500">{row.job_title}</p> : null}
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href={contactWorkspaceHref(contact, "company")}
            className="mt-2 inline-block text-xs font-medium text-violet-800 hover:underline"
          >
            Manage company →
          </Link>
        </ContextSection>
        <ContextSection title="Linked deals">
          {recentDeals.length === 0 ? (
            <p className="text-xs text-slate-500">No linked deals.</p>
          ) : (
            <ul className="space-y-2">
              {recentDeals.map((row) => (
                <li key={row.id}>
                  <Link href={opportunityDetailHref(row.id, "overview")} className="font-medium text-violet-900 hover:underline">
                    {row.client_name}
                  </Link>
                  <p className="text-xs text-slate-500">{row.role_label}</p>
                </li>
              ))}
            </ul>
          )}
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
          Referral structure extensible via deal party roles. AI assist disabled until R4.
        </p>
      </div>
    </div>
  );
}
