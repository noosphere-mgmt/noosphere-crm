import type { AdminModuleKey } from "@/components/admin/moduleTheme";

export type AdminNavItem = {
  href: string;
  label: string;
  desc: string;
  module: AdminModuleKey;
  bottomNav?: boolean;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", module: "dashboard", desc: "Your day at a glance", bottomNav: true },
  {
    href: "/admin/properties",
    label: "Properties",
    module: "properties",
    desc: "All Premises · All Buildings",
    bottomNav: true,
  },
  {
    href: "/admin/companies",
    label: "Connections",
    module: "connections",
    desc: "Companies · Contacts",
    bottomNav: true,
  },
  {
    href: "/admin/opportunities",
    label: "Opportunities",
    module: "opportunities",
    desc: "Requirements & proposals",
    bottomNav: true,
  },
  {
    href: "/admin/activities",
    label: "Activities",
    module: "activities",
    desc: "Calls, meetings & site tours",
  },
  { href: "/admin/import", label: "Tools", module: "tools", desc: "Import workbench & glossary" },
];

export function isAdminNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.module === "connections") {
    return (
      pathname === "/admin/connections" ||
      pathname.startsWith("/admin/companies") ||
      pathname.startsWith("/admin/contacts")
    );
  }
  if (item.href === "/admin") {
    return pathname === "/admin" || pathname === "/admin/";
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
