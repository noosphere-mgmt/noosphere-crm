"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CONNECTION_ROLE_QUICK_FILTERS } from "@/lib/connectionsList";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import type { CompanyRole } from "@/lib/types/entities";

/** Compact relationship-type pills for the search toolbar. */
export function ConnectionsRelationshipTypeFilters() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeRole = (searchParams.get("role") as CompanyRole | null) || null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {CONNECTION_ROLE_QUICK_FILTERS.map(({ role, label }) => {
        const params = new URLSearchParams(searchParams.toString());
        if (role) params.set("role", role);
        else params.delete("role");
        const qs = params.toString();
        const href = qs ? `${pathname}?${qs}` : pathname;
        const active = (role ?? null) === (activeRole || null);
        return (
          <Link
            key={label}
            href={href}
            className={active ? connectionsGlassClasses.rolePillActive : connectionsGlassClasses.rolePillInactive}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
