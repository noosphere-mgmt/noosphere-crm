"use client";

import Link from "next/link";
import { IconX } from "@/components/admin/ModuleActionIcons";
import { moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { adminReturnToLabel } from "@/lib/adminReturnTo";
import { formatCompanyRoles } from "@/lib/connectionsDisplay";
import { companyWorkspaceHref } from "@/lib/companyWorkspaceNav";
import type { Company } from "@/lib/types/entities";

export function CompanyWorkspaceHeader({
  company,
  lastActivityDate,
  returnTo = "/admin/companies",
}: {
  company: Company;
  lastActivityDate?: string | null;
  returnTo?: string;
}) {
  const theme = moduleAccentClasses("connections");
  const roleLabel = formatCompanyRoles(company.roles?.length ? company.roles : ["client"]);
  const backLabel = adminReturnToLabel(returnTo, "Companies");
  const location = [company.district, company.city, company.country].filter(Boolean).join(" · ");

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href={returnTo} className={`text-xs font-medium ${theme.link}`}>
            ← {backLabel}
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {company.company_name}
          </h1>
          <RecordBusinessId id={company.business_id} className="mt-0.5 block" />
          {location ? (
            <p className="mt-2 text-sm text-slate-600">{location}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Location will appear when city/district are filled.</p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            {lastActivityDate ? `Last activity ${lastActivityDate.slice(0, 10)} · ` : null}
            Double-click a field to edit · saves automatically
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {roleLabel ? (
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800">
                {roleLabel}
              </span>
            ) : null}
            {company.open_opportunities != null && company.open_opportunities > 0 ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                {company.open_opportunities} open{" "}
                {company.open_opportunities === 1 ? "opportunity" : "opportunities"}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Link
            href={companyWorkspaceHref(company, "activities", undefined, returnTo)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Log activity
          </Link>
          <Link
            href={companyWorkspaceHref(company, "profile", "edit", returnTo)}
            className={moduleEditButtonClass("connections")}
            aria-label="Edit company"
            title="Edit company"
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
