/** Connections module accents — aligned with soft liquid purple CRM standard. */

import { moduleAccentClasses } from "@/components/admin/moduleTheme";

const connections = moduleAccentClasses("connections");

export const connectionsGlassAccent = "#A78BFA";

export const connectionsGlassClasses = {
  navActive: connections.pillActive,
  header: `border border-slate-200 bg-white ${connections.headerBar}`,
  tabActive: connections.tabActive,
  tabInactive: connections.tabInactive,
  primaryButton: connections.primaryButton,
  link: connections.link,
  inputFocus: "focus:border-[#A78BFA] focus:outline-none focus:ring-2 focus:ring-[#F5F3FF]",
  rolePillActive: connections.filterPillActive,
  rolePillInactive: connections.filterPillInactive,
} as const;

export function connectionsTabClass(active: boolean): string {
  return active ? connectionsGlassClasses.tabActive : connectionsGlassClasses.tabInactive;
}
