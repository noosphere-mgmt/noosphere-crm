import type { AdminModuleKey } from "@/components/admin/moduleTheme";

export type AdminNavItem = {
  href: string;
  label: string;
  desc?: string;
  module: AdminModuleKey;
  bottomNav?: boolean;
};

export type AdminSettingsItem = {
  href: string;
  label: string;
  description: string;
};

/** Primary top navigation — advisory workspace modules. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Home", module: "dashboard", bottomNav: true },
  { href: "/admin/leads", label: "Leads", module: "opportunities" },
  { href: "/admin/opportunities", label: "Opportunities", module: "opportunities", bottomNav: true },
  { href: "/admin/properties", label: "Properties", module: "properties", bottomNav: true },
  { href: "/admin/contacts", label: "Connections", module: "connections", bottomNav: true },
  { href: "/admin/activities", label: "Activities", module: "activities", bottomNav: true },
];

/** Administrative functions — gear menu only. */
export const ADMIN_SETTINGS_ITEMS: AdminSettingsItem[] = [
  { href: "/admin/settings/users", label: "CRM Users & Access", description: "Human and virtual staff ownership" },
  {
    href: "/admin/import",
    label: "Import Workbench",
    description: "CSV import and column mapping",
  },
  {
    href: "/admin/import/history",
    label: "Data Management",
    description: "Import history and run audit",
  },
  {
    href: "/admin/settings/configuration",
    label: "Configuration",
    description: "Email, AI and system configuration",
  },
  {
    href: "/admin/glossary",
    label: "Reference Data",
    description: "Brokerage model glossary",
  },
];

export function isAdminNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.module === "connections") {
    return (
      pathname === "/admin/connections" ||
      pathname.startsWith("/admin/companies") ||
      pathname.startsWith("/admin/contacts")
    );
  }
  if (item.module === "tools") {
    return pathname.startsWith("/admin/import") || pathname.startsWith("/admin/glossary");
  }
  if (item.href === "/admin") {
    return pathname === "/admin" || pathname === "/admin/";
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function isAdminSettingsActive(pathname: string): boolean {
  return ADMIN_SETTINGS_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}
