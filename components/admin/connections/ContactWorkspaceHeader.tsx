"use client";

import Link from "next/link";
import { IconX } from "@/components/admin/ModuleActionIcons";
import { moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { adminReturnToLabel } from "@/lib/adminReturnTo";
import { getContactLabel } from "@/lib/contactName";
import { companyWorkspaceHref } from "@/lib/companyWorkspaceNav";
import { contactWorkspaceHref } from "@/lib/contactWorkspaceNav";
import type { ContactCompanyAffiliation } from "@/lib/repos/contactCompanyAffiliations";
import type { Contact } from "@/lib/types/entities";

export function ContactWorkspaceHeader({
  contact,
  affiliations,
  lastActivityDate,
  returnTo = "/admin/companies",
}: {
  contact: Contact;
  affiliations: ContactCompanyAffiliation[];
  lastActivityDate?: string | null;
  returnTo?: string;
}) {
  const theme = moduleAccentClasses("connections");
  const title = getContactLabel(contact);
  const primaryAff =
    affiliations.find((a) => a.is_primary) ?? affiliations[0] ?? null;
  const companyName = primaryAff?.company_name ?? contact.company_name;
  const companyHref =
    primaryAff?.company_business_id || primaryAff?.company_id || contact.company_id
      ? companyWorkspaceHref(
          {
            id: primaryAff?.company_id ?? contact.company_id!,
            business_id: primaryAff?.company_business_id ?? contact.company_business_id,
          },
          "profile",
          undefined,
          // From company review, return to this contact page.
          contactWorkspaceHref(contact, "overview", undefined, returnTo),
        )
      : null;
  const backLabel = adminReturnToLabel(returnTo, "Companies");

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href={returnTo} className={`text-xs font-medium ${theme.link}`}>
            ← {backLabel}
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
          <RecordBusinessId id={contact.business_id} className="mt-0.5 block" />
          {companyName ? (
            <p className="mt-2 text-sm text-slate-600">
              {companyHref ? (
                <>
                  <span className="text-slate-500">Company </span>
                  <Link href={companyHref} className="font-medium text-violet-900 hover:underline">
                    {companyName}
                  </Link>
                </>
              ) : (
                companyName
              )}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-slate-500">
            {lastActivityDate ? `Last activity ${lastActivityDate.slice(0, 10)} · ` : null}
            Double-click a field to edit · saves automatically
          </p>
          {contact.title ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800">
                {contact.title}
              </span>
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Link
            href={contactWorkspaceHref(contact, "activities", undefined, returnTo)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Log activity
          </Link>
          <Link
            href={contactWorkspaceHref(contact, "overview", "edit", returnTo)}
            className={moduleEditButtonClass("connections")}
            aria-label="Edit contact"
            title="Edit contact"
          >
            Edit
          </Link>
          <Link
            href={returnTo}
            className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
            title="Close"
          >
            <IconX />
          </Link>
        </div>
      </div>
    </div>
  );
}
