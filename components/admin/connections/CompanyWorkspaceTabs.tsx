"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { COMPANY_WORKSPACE_TABS, getCompanyWorkspaceTab } from "@/lib/companyWorkspaceTab";
import { companyWorkspaceHref } from "@/lib/companyWorkspaceNav";
import type { Company } from "@/lib/types/entities";

const tabClasses = {
  profile: {
    active: "border-violet-600 bg-violet-600 text-white",
    idle: "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100",
  },
  contacts: {
    active: "border-blue-600 bg-blue-600 text-white",
    idle: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
  },
  deals: {
    active: "border-emerald-600 bg-emerald-600 text-white",
    idle: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  },
  supply: {
    active: "border-amber-500 bg-amber-500 text-white",
    idle: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
  },
  activities: {
    active: "border-rose-500 bg-rose-500 text-white",
    idle: "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100",
  },
  fees: {
    active: "border-slate-700 bg-slate-700 text-white",
    idle: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
  },
} as const;

export function CompanyWorkspaceTabs({
  company,
  counts,
  returnTo,
}: {
  company: Company;
  counts?: { contacts?: number; deals?: number; supply?: number };
  returnTo?: string | null;
}) {
  const searchParams = useSearchParams();
  const active = getCompanyWorkspaceTab({ tab: searchParams.get("tab") });

  return (
    <nav className="flex gap-2 pb-1" aria-label="Company workspace sections">
      {COMPANY_WORKSPACE_TABS.map((tab) => {
        const isActive = active === tab.id;
        const href = companyWorkspaceHref(company, tab.id, undefined, returnTo);
        const count =
          tab.id === "contacts"
            ? counts?.contacts ?? 0
            : tab.id === "deals"
              ? counts?.deals ?? 0
              : tab.id === "supply"
                ? counts?.supply ?? 0
                : 0;
        const label =
          count > 0 && (tab.id === "contacts" || tab.id === "deals" || tab.id === "supply")
            ? `${tab.label} (${count})`
            : tab.label;
        return (
          <Link
            key={tab.id}
            href={href}
            className={`whitespace-nowrap rounded-t-lg border px-3.5 py-2 text-sm font-semibold shadow-sm transition ${
              isActive ? tabClasses[tab.id].active : tabClasses[tab.id].idle
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
