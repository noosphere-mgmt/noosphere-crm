"use client";

import Link from "next/link";
import { IconPen, IconX } from "@/components/admin/ModuleActionIcons";
import { moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { formatCompanyRoles } from "@/lib/connectionsDisplay";
import { companyWorkspaceHref } from "@/lib/companyWorkspaceNav";
import type { Company } from "@/lib/types/entities";

export function CompanyWorkspaceHeader({
  company,
  lastActivityDate,
}: {
  company: Company;
  lastActivityDate?: string | null;
}) {
  const theme = moduleAccentClasses("connections");
  const roleLabel = formatCompanyRoles(company.roles?.length ? company.roles : ["client"]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href="/admin/companies" className={`text-xs font-medium ${theme.link}`}>
            ← Companies
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {company.company_name}
          </h1>
          <RecordBusinessId id={company.business_id} className="mt-0.5 block" />
          <p className="mt-2 text-sm text-slate-600">{roleLabel}</p>
          {lastActivityDate ? (
            <p className="mt-1 text-xs text-slate-500">Last activity {lastActivityDate.slice(0, 10)}</p>
          ) : null}
        </div>
        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
          <Link
            href={companyWorkspaceHref(company, "activities")}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 sm:flex-none"
          >
            Log activity
          </Link>
          <Link
            href={companyWorkspaceHref(company, "profile", "edit")}
            className={moduleEditButtonClass("connections")}
            aria-label="Edit company"
            title="Edit company"
          >
            <IconPen />
          </Link>
          <Link
            href="/admin/companies"
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
