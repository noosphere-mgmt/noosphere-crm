"use client";

import Link from "next/link";
import { IconPen, IconX } from "@/components/admin/ModuleActionIcons";
import { moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { companyFullPageHref } from "@/lib/crmDetailNav";
import { getContactLabel } from "@/lib/contactName";
import { contactWorkspaceHref } from "@/lib/contactWorkspaceNav";
import type { ContactCompanyAffiliation } from "@/lib/repos/contactCompanyAffiliations";
import type { Contact } from "@/lib/types/entities";

export function ContactWorkspaceHeader({
  contact,
  affiliations,
  lastActivityDate,
}: {
  contact: Contact;
  affiliations: ContactCompanyAffiliation[];
  lastActivityDate?: string | null;
}) {
  const theme = moduleAccentClasses("connections");
  const title = getContactLabel(contact);
  const primaryAff =
    affiliations.find((a) => a.is_primary) ?? affiliations[0] ?? null;
  const companyName = primaryAff?.company_name ?? contact.company_name;
  const companyHref = companyFullPageHref(primaryAff?.company_business_id);

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href="/admin/contacts" className={`text-xs font-medium ${theme.link}`}>
            ← Contacts
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
          {lastActivityDate ? (
            <p className="mt-1 text-xs text-slate-500">Last activity {lastActivityDate.slice(0, 10)}</p>
          ) : null}
        </div>
        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
          <Link
            href={contactWorkspaceHref(contact, "activities")}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 sm:flex-none"
          >
            Log activity
          </Link>
          <Link
            href={contactWorkspaceHref(contact, "profile", "edit")}
            className={moduleEditButtonClass("connections")}
            aria-label="Edit contact"
            title="Edit contact"
          >
            <IconPen />
          </Link>
          <Link
            href="/admin/contacts"
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
