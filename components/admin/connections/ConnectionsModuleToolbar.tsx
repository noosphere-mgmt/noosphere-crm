"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { connectionsTabClass } from "@/lib/connectionsGlassTheme";

function connectionsMobileTabClass(active: boolean): string {
  const base = "rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap";
  if (active) {
    return `${base} border border-[#DDD6FE] bg-[#F5F3FF] font-semibold text-[#5B21B6]`;
  }
  return `${base} text-slate-600 hover:bg-slate-50`;
}

export function ConnectionsModuleToolbar({
  trailing,
  createHref,
  onCreate,
  createLabel,
}: {
  trailing?: ReactNode;
  createHref?: string;
  onCreate?: () => void;
  createLabel: string;
}) {
  const pathname = usePathname();
  const isCompanies =
    pathname === "/admin/connections" ||
    pathname === "/admin/companies" ||
    pathname.startsWith("/admin/companies/");
  const isContacts = pathname === "/admin/contacts" || pathname.startsWith("/admin/contacts/");

  const createButtonClass =
    "flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-lg leading-none text-slate-600 hover:bg-slate-50";

  return (
    <div className="mb-2 flex items-center gap-1.5">
      <span className="shrink-0 text-sm font-semibold text-slate-900">Connections</span>
      <nav
        aria-label="Connections sections"
        className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto"
      >
        <Link href="/admin/companies" className={connectionsMobileTabClass(isCompanies)}>
          Companies
        </Link>
        <Link href="/admin/contacts" className={connectionsMobileTabClass(isContacts)}>
          Contacts
        </Link>
      </nav>
      <div className="flex shrink-0 items-center gap-1">
        {trailing}
        {createHref ? (
          <Link href={createHref} className={createButtonClass} aria-label={createLabel} title={createLabel}>
            +
          </Link>
        ) : onCreate ? (
          <button type="button" onClick={onCreate} className={createButtonClass} aria-label={createLabel} title={createLabel}>
            +
          </button>
        ) : null}
      </div>
    </div>
  );
}
