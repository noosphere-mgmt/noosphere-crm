export const PROPERTY_TYPES = [
  "Commercial Building",
  "Industrial Building",
  "Residential",
  "Hotel",
] as const;

export const CENTRE_TYPES = ["Serviced Office", "Shared Office"] as const;

export const PROPERTY_STATUSES = ["active", "inactive", "archived"] as const;

export const LAND_USE_TYPES = ["Commercial", "Industrial", "Residential", "Mixed Use"] as const;

export const OWNERSHIP_TYPES = [
  "Single Owner",
  "Multiple Owners",
  "Strata Title",
  "Government",
] as const;

export const BUILDING_GRADES = ["Grade A", "Grade B", "Grade C"] as const;

export const BUILDING_TITLES = ["Single Owner", "Strata Title"] as const;

export const ASSET_TYPES = ["Floor", "Unit", "Suite", "Room", "Enbloc"] as const;

export const ASSET_STATUSES = ["active", "inactive", "archived"] as const;

export const OFFER_TYPES = [
  "Unit",
  "Floor",
  "Enbloc",
  "Serviced Office",
  "Shared Office",
] as const;

export const OFFICE_TYPES = [
  "Private Office",
  "Hot Desk",
  "Dedicated Desk",
  "Meeting Room",
  "Virtual Office",
] as const;

export const VIEW_TYPES = [
  "City View",
  "Harbour View",
  "Mountain View",
  "Park View",
  "Internal",
  "No View",
] as const;

export const WINDOW_TYPES = ["Yes", "No", "Partial"] as const;

export const INVENTORY_STATUSES = ["available", "proposed", "leased", "withdrawn"] as const;

export const LISTING_INTENTS = ["lease", "sale", "both"] as const;

/** Top-level physical classification on inventory `properties` rows. */
export const PROPERTY_CATEGORIES = [
  "Office",
  "Residential",
  "Commercial / Residential",
  "Industrial",
  "Retail",
  "Hotel",
  "Mixed Use",
  "Land",
  "Investment",
] as const;

/** How a property is operated — independent of property category. */
export const OPERATING_MODELS = [
  "Conventional Space",
  "Serviced Office",
  "Shared Office",
  "Serviced Apartment",
  "Hotel Operation",
] as const;

/** Physical / deal form of a space within a building. */
export const SPACE_FORMS = [
  "Unit (s)",
  "Floor (s)",
  "Enbloc",
  "Land",
] as const;

/** Current occupancy state of a marketable property row. */
export const OCCUPANCY_STATUSES = [
  "Vacant",
  "Owner Occupied",
  "Tenanted",
  "Partially Occupied",
] as const;

/** Lifecycle status on inventory `properties` rows (not building/site status). */
export const MARKETABLE_PROPERTY_STATUSES = [
  "available",
  "proposed",
  "leased",
  "sold",
  "withdrawn",
  "archived",
] as const;

export const MARKETABLE_PROPERTY_STATUS_LABELS: Record<
  (typeof MARKETABLE_PROPERTY_STATUSES)[number],
  string
> = {
  available: "Available",
  proposed: "Proposed",
  leased: "Leased",
  sold: "Sold",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

export const FURNITURE_OPTIONS = [
  "Fully Furnished",
  "Partially Furnished",
  "Unfurnished",
] as const;

export const OFFICE_EQUIPMENT_OPTIONS = [
  "Included",
  "Partial",
  "Not Included",
] as const;

export const MEETING_ROOM_OPTIONS = [
  "Available",
  "Shared Facility",
  "Not Available",
] as const;

export const RECEPTION_SERVICE_OPTIONS = ["Yes", "Shared", "No"] as const;

export const IT_NETWORK_OPTIONS = ["Ready", "Partial", "Not Available"] as const;

export const MOVE_IN_STATUS_OPTIONS = [
  "Immediate",
  "Minor Fit-Out Required",
  "Major Fit-Out Required",
  "Shell & Core",
] as const;

/** Outlook from a property — inventory `properties.view_type`. */
export const PROPERTY_VIEW_TYPES = [
  "Full Seaview",
  "Partial Seaview",
  "City View",
  "Building View",
  "No Window",
] as const;

/** Physical fit-out state — inventory `properties.fitout_condition`. */
export const FITOUT_CONDITIONS = [
  "Shell & Core",
  "Bare Shell",
  "Partially Fitted",
  "Fully Fitted",
  "Luxury Fitted",
] as const;

/** Window provision — inventory `properties.window_type`. */
export const PROPERTY_WINDOW_TYPES = [
  "Full Window",
  "Partial Window",
  "No Window",
] as const;

export const LISTING_INTENT_LABELS: Record<(typeof LISTING_INTENTS)[number], string> = {
  lease: "Lease",
  sale: "Sale",
  both: "Both",
};

/** @deprecated legacy inventory table only supports lease and sale */
export const LEGACY_LISTING_INTENTS = ["lease", "sale"] as const;

export {
  ACTIVE_OPPORTUNITY_STATUSES,
  CLIENT_REVIEW_OPPORTUNITY_STATUSES,
  LEGACY_OPPORTUNITY_STATUS_MAP,
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_STATUS_LABELS,
  OPPORTUNITY_STATUS_PROBABILITY,
  defaultWaitingFor,
  formatOpportunityActionDate,
  isOpportunityStatusValue,
  normalizeOpportunityStatus,
} from "@/lib/opportunityStatusModel";

/** @deprecated Use CLIENT_REVIEW_OPPORTUNITY_STATUSES */
export { CLIENT_REVIEW_OPPORTUNITY_STATUSES as CLIENT_WAITING_OPPORTUNITY_STATUSES } from "@/lib/opportunityStatusModel";

export const OPPORTUNITY_LEAD_TYPES = [
  "agent_lead",
  "direct_client",
  "investor",
  "landlord",
] as const;

export const OPPORTUNITY_LEAD_TYPE_LABELS: Record<(typeof OPPORTUNITY_LEAD_TYPES)[number], string> = {
  agent_lead: "Referral",
  direct_client: "Direct client",
  investor: "Investor",
  landlord: "Landlord",
};

/** Source labels for opportunity workspace (avoid "lead" in UI). */
export const OPPORTUNITY_SOURCE_LABELS = OPPORTUNITY_LEAD_TYPE_LABELS;

export const WORKSPACE_TYPES = [
  "Whole floor",
  "Unit",
  "Serviced office",
  "Shared office",
  "Traditional lease",
  "Industrial",
  "Retail",
  "Any",
] as const;

import {
  CONNECTION_COMPANY_ROLE_LABELS,
  CONNECTION_COMPANY_ROLES,
  COVERAGE_OPTIONS,
} from "@/lib/connectionsValues";

export { CONNECTION_COMPANY_ROLES as COMPANY_ROLES, COVERAGE_OPTIONS };
export const COMPANY_ROLE_LABELS: Record<string, string> = {
  ...CONNECTION_COMPANY_ROLE_LABELS,
  developer: "Other",
  property_management: "Bldg Mgmt",
  service_provider: "Other",
};

/** CRM filtered-view titles for /admin/companies?role= */
export const COMPANY_ROLE_VIEW_LABELS: Partial<Record<string, string>> = {
  client: "Clients",
  prospect: "Prospects",
  investor: "Investors",
  operator: "Operators",
  landlord: "Landlords",
  building_management: "Bldg Mgmt",
  agency: "Agencies",
  referrer: "Referrers",
  vendor: "Vendors",
  other: "Other",
};

/** Resolve company/contact role tokens including common aliases (e.g. Agent → agency). */
export function resolveCompanyRoleToken(part: string): (typeof CONNECTION_COMPANY_ROLES)[number] | null {
  const trimmed = part.trim();
  if (!trimmed) return null;
  const slug = trimmed.toLowerCase().replace(/\s+/g, "_");
  const aliases: Record<string, (typeof CONNECTION_COMPANY_ROLES)[number]> = {
    agent: "agency",
    agents: "agency",
    bldg_mgmt: "building_management",
    building_mgmt: "building_management",
    property_management: "building_management",
  };
  if (aliases[slug]) return aliases[slug];
  const byRole = (CONNECTION_COMPANY_ROLES as readonly string[]).find(
    (r) =>
      r === slug ||
      CONNECTION_COMPANY_ROLE_LABELS[r as (typeof CONNECTION_COMPANY_ROLES)[number]].toLowerCase() ===
        trimmed.toLowerCase() ||
      (COMPANY_ROLE_LABELS[r] ?? "").toLowerCase() === trimmed.toLowerCase(),
  );
  return (byRole as (typeof CONNECTION_COMPANY_ROLES)[number] | undefined) ?? null;
}

export const RELATIONSHIP_STRENGTHS = ["cold", "warm", "active", "strategic"] as const;

export const RELATIONSHIP_STRENGTH_LABELS: Record<(typeof RELATIONSHIP_STRENGTHS)[number], string> = {
  cold: "Cold",
  warm: "Warm",
  active: "Active",
  strategic: "Strategic",
};

export const PREFERRED_LANGUAGES = ["English", "Cantonese", "Mandarin", "Other"] as const;
