import type { ImportObjectType } from "./types";

export type ImportRunModuleLink = {
  href: string;
  label: string;
};

const IMPORT_RUN_MODULE_LINKS: Record<ImportObjectType, ImportRunModuleLink> = {
  buildings: { href: "/admin/properties/buildings", label: "View buildings" },
  premises: { href: "/admin/properties", label: "View premises" },
  companies: { href: "/admin/companies", label: "View companies" },
  contacts: { href: "/admin/contacts", label: "View contacts" },
  relationships: { href: "/admin/companies", label: "View relationships" },
  opportunities: { href: "/admin/opportunities", label: "View opportunities" },
  opportunity_parties: { href: "/admin/opportunities", label: "View opportunities" },
  opportunity_proposed_premises: { href: "/admin/opportunities", label: "View opportunities" },
  activities: { href: "/admin/activities", label: "View activities" },
  activity_premises: { href: "/admin/activities", label: "View activities" },
};

export function getImportRunModuleLink(objectType: ImportObjectType): ImportRunModuleLink {
  return IMPORT_RUN_MODULE_LINKS[objectType];
}
