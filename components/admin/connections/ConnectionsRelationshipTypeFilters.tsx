"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CONNECTION_ROLE_QUICK_FILTERS } from "@/lib/connectionsList";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import type { CompanyRole } from "@/lib/types/entities";

/** Compact relationship-type pills for the search toolbar. */
export function ConnectionsRelationshipTypeFilters({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeRole = (searchParams.get("role") as CompanyRole | null) || null;

  const filters = compact
    ? CONNECTION_ROLE_QUICK_FILTERS.filter((f) =>
        f.role === "prospect" || f.role === "operator" || f.role === "agency",
      )
    : CONNECTION_ROLE_QUICK_FILTERS;

  return (
    <div className={`flex shrink-0 items-center gap-1 ${compact ? "flex-nowrap" : "flex-wrap gap-1.5"}`}>
      {filters.map(({ role, label }) => {
        const params = new URLSearchParams(searchParams.toString());
        if (role) params.set("role", role);
        else params.delete("role");
        const qs = params.toString();
        const href = qs ? `${pathname}?${qs}` : pathname;
        const active = (role ?? null) === (activeRole || null);

        if (compact) {
          const isActive = role != null && role === activeRole;
          const pillClass = isActive
            ? connectionsGlassClasses.rolePillActive
            : connectionsGlassClasses.rolePillInactive;
          const toggleHref = isActive
            ? (() => {
                const clearParams = new URLSearchParams(searchParams.toString());
                clearParams.delete("role");
                const clearQs = clearParams.toString();
                return clearQs ? `${pathname}?${clearQs}` : pathname;
              })()
            : href;

          return (
            <Link
              key={label}
              href={toggleHref}
              className={`${pillClass} whitespace-nowrap px-2 py-1 text-[11px] font-medium`}
            >
              {label}
            </Link>
          );
        }

        const pillClass = active
          ? connectionsGlassClasses.rolePillActive
          : connectionsGlassClasses.rolePillInactive;

        return (
          <Link
            key={label}
            href={href}
            className={`${pillClass} block w-full text-center md:inline-block md:w-auto`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
