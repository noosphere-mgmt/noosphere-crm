"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { COMPANY_WORKSPACE_TABS, getCompanyWorkspaceTab } from "@/lib/companyWorkspaceTab";
import { companyWorkspaceHref } from "@/lib/companyWorkspaceNav";
import type { Company } from "@/lib/types/entities";

export function CompanyWorkspaceTabs({
  company,
  counts,
}: {
  company: Company;
  counts?: { contacts?: number; deals?: number; supply?: number };
}) {
  const searchParams = useSearchParams();
  const active = getCompanyWorkspaceTab({ tab: searchParams.get("tab") });

  return (
    <nav className="flex gap-1 pb-1" aria-label="Company workspace sections">
      {COMPANY_WORKSPACE_TABS.map((tab) => {
        const isActive = active === tab.id;
        const href = companyWorkspaceHref(company, tab.id);
        const count =
          tab.id === "contacts"
            ? counts?.contacts ?? 0
            : tab.id === "deals"
              ? counts?.deals ?? 0
              : tab.id === "supply"
                ? counts?.supply ?? 0
                : 0;
        return (
          <Link
            key={tab.id}
            href={href}
            className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm ${
              isActive
                ? "bg-[rgba(91,33,182,0.14)] text-violet-900"
                : "text-slate-600 hover:bg-[rgba(91,33,182,0.08)] hover:text-violet-900"
            }`}
          >
            {tab.label}
            {count > 0 ? ` ${count}` : ""}
          </Link>
        );
      })}
    </nav>
  );
}
