"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { connectionsTabClass } from "@/lib/connectionsGlassTheme";

export function ConnectionsModuleNav({ embedded = false }: { embedded?: boolean }) {
  const pathname = usePathname();
  const isCompanies =
    pathname === "/admin/connections" ||
    pathname === "/admin/companies" ||
    pathname.startsWith("/admin/companies/");
  const isContacts = pathname === "/admin/contacts" || pathname.startsWith("/admin/contacts/");

  return (
    <nav
      aria-label="Connections sections"
      className={
        embedded
          ? "flex flex-wrap items-center gap-1 text-sm"
          : "mb-4 flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-sm"
      }
    >
      <Link href="/admin/companies" className={connectionsTabClass(isCompanies)}>
        Companies
      </Link>
      <Link href="/admin/contacts" className={connectionsTabClass(isContacts)}>
        Contacts
      </Link>
    </nav>
  );
}
