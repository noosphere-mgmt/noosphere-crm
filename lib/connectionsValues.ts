/** Connections module list values */

export const CONNECTION_COMPANY_ROLES = [
  "client",
  "prospect",
  "investor",
  "operator",
  "landlord",
  "building_management",
  "agency",
  "service_provider",
  "referrer",
  "vendor",
  "other",
] as const;

export const CONNECTION_COMPANY_ROLE_LABELS: Record<
  (typeof CONNECTION_COMPANY_ROLES)[number],
  string
> = {
  client: "Client",
  prospect: "Prospect",
  investor: "Investor",
  operator: "Operator",
  landlord: "Landlord",
  building_management: "Bldg Mgmt",
  agency: "Agency",
  service_provider: "Service Provider",
  referrer: "Referrer",
  vendor: "Vendor",
  other: "Other",
};

export const COVERAGE_OPTIONS = [
  "Commercial",
  "Residential",
  "Industrial",
  "Hotel",
  "Retail",
  "Serviced Office",
  "Investment",
] as const;

export const ACTIVITY_TYPES = [
  "Call",
  "WhatsApp",
  "WeChat",
  "Meeting",
  "Site Tour",
  "Note",
  "Site Inspection",
  "Proposal Sent",
  "Follow-up",
  "Lunch",
  "Coffee",
  "Referral",
  "Introduction",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];
