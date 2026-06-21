"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

function propertiesMobileTabClass(active: boolean): string {
  const base = "rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap";
  if (active) {
    return `${base} border border-[#BFDBFE] bg-[#EFF6FF] font-semibold text-[#1D4ED8]`;
  }
  return `${base} text-slate-600 hover:bg-slate-50`;
}

export function PropertiesModuleToolbar({ trailing }: { trailing?: ReactNode }) {
  const pathname = usePathname();
  const isPremises = pathname === "/admin/properties";
  const isBuildings = pathname.startsWith("/admin/properties/buildings");
  const createHref = isBuildings ? "/admin/properties/buildings/new" : "/admin/properties/premises/new";
  const createLabel = isBuildings ? "New building" : "New premise";
  const theme = moduleAccentClasses("properties");

  return (
    <div className="mb-2 flex items-center gap-1.5">
      <span className={`shrink-0 text-sm font-bold ${theme.navActiveTitle}`}>Properties</span>
      <nav
        aria-label="Properties sections"
        className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto"
      >
        <Link href="/admin/properties" className={propertiesMobileTabClass(isPremises)}>
          All Premises
        </Link>
        <Link href="/admin/properties/buildings" className={propertiesMobileTabClass(isBuildings)}>
          All Building
        </Link>
      </nav>
      <div className="flex shrink-0 items-center gap-1">
        {trailing}
        <Link
          href={createHref}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-lg leading-none text-slate-600 hover:bg-slate-50"
          aria-label={createLabel}
          title={createLabel}
        >
          +
        </Link>
      </div>
    </div>
  );
}
