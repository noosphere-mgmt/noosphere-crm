/** Values from NML_DataSchema_Revise.xlsx — List Value + Properties sheets */

export {
  PROPERTY_CATEGORIES,
  SPACE_FORMS,
  CANONICAL_LISTING_INTENTS,
  CANONICAL_LISTING_INTENT_LABELS,
} from "@/lib/premisesClassification";

export const V1_PROPERTY_TYPES = [
  "Commercial",
  "Residential",
  "Retails",
  "Land",
  "Mixed Use",
  "Industrial",
] as const;

export const PREMISES_ASSET_CLASSES = [
  { value: "commercial", label: "Commercial" },
  { value: "residential", label: "Residential" },
  { value: "industrial", label: "Industrial" },
  { value: "land", label: "Land" },
  { value: "other", label: "Other" },
] as const;

export const PREMISES_ASSET_SCOPES = [
  { value: "unit", label: "Unit / Strata Title" },
  { value: "whole_building", label: "Whole Building / En-bloc" },
  { value: "land", label: "Land" },
  { value: "unknown", label: "Unknown" },
] as const;

export const PREMISES_MARKET_MODES = [
  { value: "lease", label: "Lease" },
  { value: "sale", label: "Sale" },
] as const;

export const PREMISES_PRODUCT_SUBTYPES = {
  commercial: [
    { value: "conventional_office", label: "Conventional Office" },
    { value: "serviced_office", label: "Serviced Office" },
    { value: "shared_sublet_office", label: "Shared / Sublet Office" },
    { value: "shop_retail", label: "Shop / Retail" },
  ],
  residential: [
    { value: "flat", label: "Flat" },
    { value: "serviced_unit", label: "Serviced Unit" },
    { value: "shared_flat", label: "Shared Flat" },
  ],
  industrial: [{ value: "industrial_unit", label: "Industrial Unit" }],
  land: [{ value: "land", label: "Land" }],
  other: [{ value: "other", label: "Other" }],
  unknown: [{ value: "unknown", label: "Unknown" }],
} as const;

export const PREMISES_WHOLE_ASSET_TYPES = [
  { value: "hotel", label: "Hotel" },
  { value: "residential_building", label: "Residential Building" },
  { value: "commercial_building", label: "Commercial Building" },
  { value: "industrial_building", label: "Industrial Building" },
  { value: "mixed_use_building", label: "Mixed-use Building" },
  { value: "other", label: "Other" },
  { value: "unknown", label: "Unknown" },
] as const;

export const PREMISES_OCCUPANCY_STATUSES = [
  { value: "vacant", label: "Vacant" },
  { value: "owner_occupied", label: "Owner Occupied" },
  { value: "tenant_occupied", label: "Tenant Occupied" },
  { value: "partly_occupied", label: "Partly Occupied" },
  { value: "unknown", label: "Unknown" },
] as const;

export const PREMISES_AVAILABILITY_STATUSES = [
  { value: "available", label: "Available" },
  { value: "leased", label: "Leased" },
  { value: "sold", label: "Sold" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

export const PREMISES_DISCOVERY_STATUSES = [
  { value: "lead_rumour", label: "Lead / Rumour" },
  { value: "identified", label: "Identified" },
  { value: "investigating", label: "Investigating" },
  { value: "contacted", label: "Contacted" },
  { value: "details_received", label: "Details Received" },
  { value: "verified", label: "Verified" },
  { value: "not_pursuing", label: "Not Pursuing" },
] as const;

export const PREMISES_ACCESS_STATUSES = [
  { value: "direct_owner", label: "Direct Owner / Landlord Contact" },
  { value: "partner_agent", label: "Partner Agent Access" },
  { value: "referral_contact", label: "Referral Contact" },
  { value: "land_search", label: "Land Search Required" },
  { value: "address_pending", label: "Address / Ownership Pending" },
  { value: "no_contact", label: "No Contact Yet" },
  { value: "access_confirmed", label: "Access Confirmed" },
  { value: "access_restricted", label: "Access Restricted" },
] as const;

export const PREMISES_SOURCE_TYPES = [
  { value: "direct", label: "Direct" },
  { value: "partner_agent", label: "Partner Agent" },
  { value: "public_source", label: "Public Source" },
  { value: "import", label: "Import" },
  { value: "other", label: "Others" },
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
  "Open View",
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
  "Partial Furnished",
  "Well Furnished",
  "Luxury Furnished",
  "Ceiling & Carpet",
  "Bareshell",
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
  "Current Occupant",
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
