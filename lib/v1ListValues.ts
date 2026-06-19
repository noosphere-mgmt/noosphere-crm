/** Values from NML_DataSchema_Revise.xlsx — List Value + Properties sheets */

export const V1_PROPERTY_TYPES = [
  "Commercial",
  "Residential",
  "Retails",
  "Land",
  "Mixed Use",
  "Industrial",
] as const;

export const V1_CENTRE_TYPES = [
  "Conventional",
  "Serviced Office",
  "Shared Office",
  "Serviced Apartment",
  "Hotel Operation",
] as const;

export const V1_OFFICE_TYPES = [...V1_CENTRE_TYPES] as const;

export const V1_VIEW_TYPES = [
  "Full Seaview",
  "Partial Seaview",
  "City View",
  "Building View",
  "No Window",
] as const;

/** Stored in premises_v1.inventory_status */
export const V1_LISTING_INTENTS = ["For Lease", "For Sale"] as const;

/** Stored in premises_v1.offer_status */
export const V1_LISTING_STATUSES = ["Available", "Leased", "Sold", "Withdrawn"] as const;

export const V1_OFFER_TYPES = [
  "Unit (s)",
  "Floor (s)",
  "Enbloc",
  "Portfolio",
] as const;

export const V1_OPERATING_MODELS = [
  "Conventional",
  "Serviced Office",
  "Shared Office",
  "Serviced Apartment",
  "Hotel Operation",
] as const;

export const V1_FIT_OUT_CONDITIONS = [
  "Fully Furnished",
  "Partial Fitted",
  "Well Fitted",
  "Luxury Fitted",
  "Ceiling & Carpet",
  "Bare Shell",
] as const;

export const V1_DEPOSIT_MONTHS = [
  "No Deposit",
  "One-Month",
  "Two-Month",
  "Three-Month",
  "Six-Month",
] as const;

export const PREMISES_RELATIONSHIP_TYPES = [
  "Operator",
  "Owner",
  "Landlord",
  "Bldg Mgmt",
  "Current Tenant",
  "Source Agent",
  "Referrer",
  "Other",
] as const;

export type PremisesRelationshipLine = {
  relationship_type: string;
  company_id: string | null;
  contact_id: string | null;
  contact_role: string | null;
  partnership_mode: string | null;
  source_url: string | null;
  source_file: string | null;
  remarks: string | null;
};
