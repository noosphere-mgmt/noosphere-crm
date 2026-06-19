"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { moduleTabClass } from "@/components/admin/moduleTheme";

export function PropertiesModuleNav({ embedded = false }: { embedded?: boolean }) {
  const pathname = usePathname();
  const isPremises = pathname === "/admin/properties";
  const isProperties = pathname === "/admin/properties/buildings";

  return (
    <nav
      aria-label="Properties sections"
      className={
        embedded
          ? "flex flex-wrap items-center gap-1 text-sm"
          : "mb-4 flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-sm"
      }
    >
      <Link href="/admin/properties" className={moduleTabClass("properties", isPremises)}>
        All Premises
      </Link>
      <Link href="/admin/properties/buildings" className={moduleTabClass("properties", isProperties)}>
        All Buildings
      </Link>
    </nav>
  );
}
