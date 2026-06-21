export type PropertyStatus = "active" | "inactive" | "archived";
export type AssetStatus = "active" | "inactive" | "archived";
export type AssetType = "Floor" | "Unit" | "Suite" | "Room" | "Enbloc";
export type InventoryStatus = "available" | "proposed" | "leased" | "withdrawn";
export type ListingIntent = "lease" | "sale" | "both";
export type OfferType = "Unit" | "Floor" | "Enbloc" | "Serviced Office" | "Shared Office";
export type WindowType = "Yes" | "No" | "Partial";
export type OpportunityStatus =
  | "new"
  | "qualifying"
  | "sourcing"
  | "proposal_preparing"
  | "proposal_sent"
  | "negotiating"
  | "closed_won"
  | "closed_lost";

export type OpportunityLeadType =
  | "agent_lead"
  | "direct_client"
  | "investor"
  | "landlord";

export type CompanyRole =
  | "client"
  | "prospect"
  | "investor"
  | "operator"
  | "landlord"
  | "building_management"
  | "agency"
  | "referrer"
  | "vendor"
  | "other"
  /** @deprecated legacy stored value */
  | "service_provider"
  /** @deprecated legacy stored value */
  | "developer"
  /** @deprecated legacy stored value */
  | "property_management";
export type RelationshipStrength = "cold" | "warm" | "active" | "strategic";

export type Operator = {
  id: number;
  name: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Property = {
  /** Legacy site record (`_deprecated_sites`). Not the inventory `properties` table. */
  id: number;
  name_en: string;
  name_zh: string | null;
  property_type: string;
  centre_type: string | null;
  status: PropertyStatus;
  country: string;
  city: string;
  district: string;
  street_no: string | null;
  street_name_en: string | null;
  street_name_zh: string | null;
  full_address_en: string;
  full_address_zh: string | null;
  lot_number: string | null;
  land_use: string | null;
  ownership_type: string | null;
  source_url: string | null;
  last_verified_date: string | null;
  latitude: number | null;
  longitude: number | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

export type Building = {
  id: number;
  property_id: number | null;
  name_en: string;
  name_zh: string | null;
  property_type: string;
  centre_type: string | null;
  status: PropertyStatus;
  country: string;
  city: string;
  district: string;
  street_no: string | null;
  street_name_en: string | null;
  street_name_zh: string | null;
  full_address_en: string;
  full_address_zh: string | null;
  lot_number: string | null;
  land_use: string | null;
  ownership_type: string | null;
  source_url: string | null;
  last_verified_date: string | null;
  latitude: number | null;
  longitude: number | null;
  tower_block: string | null;
  floor_count: number | null;
  typical_floor_area_sqft: string | null;
  year_built: number | null;
  grade: string | null;
  mtr_station: string | null;
  walking_minutes: number | null;
  facilities: string | null;
  green_certification: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  /** @deprecated use name_en — legacy join alias */
  property_name?: string | null;
};

export type Asset = {
  id: number;
  asset_code: string | null;
  building_id: number;
  property_id: number | null;
  parent_asset_id: number | null;
  asset_type: AssetType;
  asset_status: AssetStatus;
  floor: string | null;
  unit: string | null;
  suite: string | null;
  display_name_en: string;
  display_name_zh: string | null;
  office_name: string | null;
  gross_area_sqft: string | null;
  net_area_sqft: string | null;
  capacity_pax: number | null;
  view_type: string | null;
  windows: WindowType | null;
  office_type: string | null;
  source_url: string | null;
  last_verified_date: string | null;
  remarks: string | null;
  operator_company_id: number | null;
  landlord_company_id: number | null;
  current_tenant_company_id: number | null;
  created_at: string;
  updated_at: string;
  building_label?: string | null;
  building_name?: string | null;
  property_name?: string | null;
  parent_display_name?: string | null;
  operator_company_name?: string | null;
  landlord_company_name?: string | null;
  tenant_company_name?: string | null;
};

export type Inventory = {
  id: number;
  asset_id: number;
  property_id: number | null;
  building_id: number | null;
  operator_id: number | null;
  offer_type: OfferType;
  status: InventoryStatus;
  monthly_rent: string | null;
  rent_psf: string | null;
  management_fee: string | null;
  government_rates: string | null;
  deposit_months: number | null;
  rent_free_period: string | null;
  contract_term_months: number | null;
  available_date: string | null;
  commission_rate: string | null;
  source_file: string | null;
  listing_intent: ListingIntent;
  sale_price: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  asset_display_name?: string | null;
  property_name?: string | null;
  building_label?: string | null;
  building_name?: string | null;
  operator_name?: string | null;
  asset_floor?: string | null;
  asset_unit?: string | null;
  asset_net_area_sqft?: string | null;
};

export type Company = {
  id: number;
  company_name: string;
  company_name_zh: string | null;
  company_name_cn: string | null;
  roles: CompanyRole[];
  coverage: string[];
  country: string;
  city: string;
  district: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  industry: string | null;
  source: string | null;
  relationship_owner: string | null;
  last_contact_date: string | null;
  last_meeting_date: string | null;
  next_follow_up_date: string | null;
  relationship_strength: RelationshipStrength | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  primary_contact_name?: string | null;
  open_opportunities?: number;
};

export type Contact = {
  id: number;
  company_id: number;
  contact_name: string;
  first_name: string | null;
  last_name: string | null;
  chinese_name: string | null;
  display_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  wechat: string | null;
  preferred_language: string | null;
  is_primary: boolean;
  contact_role: CompanyRole[];
  coverage: string[];
  last_contact_date: string | null;
  last_activity_date?: string | null;
  next_follow_up_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company_name?: string | null;
  company_country?: string | null;
  company_city?: string | null;
  open_opportunities?: number;
};

export type OpportunitySalesRole = "to_lease" | "to_buy";

export type OpportunityFundingStatus =
  | "cash"
  | "loan_approved"
  | "pre_approved"
  | "seeking_financing"
  | "undisclosed";

export type Opportunity = {
  id: number;
  client_name: string;
  lead_type: OpportunityLeadType;
  company_name: string | null;
  company_id: number | null;
  primary_contact_id: number | null;
  referrer_company_id: number | null;
  referrer_contact_id: number | null;
  sales_role: OpportunitySalesRole;
  lease_term: string | null;
  expected_close_date: string | null;
  lost_reason: string | null;
  relationship_owner: string | null;
  budget_min: string | null;
  budget_max: string | null;
  required_area_sqft: string | null;
  required_capacity_pax: number | null;
  district_preference: string | null;
  workspace_type: string | null;
  property_type: string | null;
  target_yield: string | null;
  funding_status: OpportunityFundingStatus | string | null;
  move_in_date: string | null;
  status: OpportunityStatus;
  requirement_summary: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  linked_company_name?: string | null;
  primary_contact_name?: string | null;
  referrer_company_name?: string | null;
  referrer_contact_name?: string | null;
  has_viewing_premises?: boolean;
};

export type ProposedPremisesStatus =
  | "proposed"
  | "presented"
  | "shortlisted"
  | "viewing"
  | "negotiation"
  | "rejected"
  | "selected"
  | "won"
  | "lost";

export type ProposedPremisesPreference = "high" | "medium" | "low";

export type FeeStatus =
  | "expected"
  | "confirmed"
  | "invoiced"
  | "paid"
  | "waived"
  | "not_applicable";

export type OpportunityProposedPremises = {
  id: number;
  opportunity_id: number;
  premises_id: string;
  rank: number | null;
  preference: ProposedPremisesPreference | null;
  status: ProposedPremisesStatus;
  proposed_date: string | null;
  tour_date: string | null;
  proposed_price: string | null;
  proposed_price_psf: string | null;
  client_comment: string | null;
  advisor_comment: string | null;
  remarks: string | null;
  related_company_id: number | null;
  related_contact_id: number | null;
  related_role: string | null;
  partnership_mode: string | null;
  collect_fee_amount: string | null;
  collect_fee_basis: string | null;
  collect_fee_from_company_id: number | null;
  collect_fee_status: FeeStatus | null;
  paid_out_fee_amount: string | null;
  paid_out_fee_basis: string | null;
  paid_out_to_company_id: number | null;
  paid_out_status: FeeStatus | null;
  fee_remarks: string | null;
  created_at: string;
  updated_at: string;
  building_name?: string | null;
  floor?: string | null;
  unit?: string | null;
  gross_area_sqft?: string | null;
  workstation_count?: string | null;
  capacity_pax?: number | null;
  monthly_rent?: string | null;
  asking_sale_price?: string | null;
  inventory_status?: string | null;
  offer_type?: string | null;
  offer_status?: string | null;
  currency?: string | null;
  operating_model?: string | null;
  site_tour_activity_date?: string | null;
  operator_name?: string | null;
  owner_name?: string | null;
  related_company_name?: string | null;
  related_contact_name?: string | null;
  collect_fee_from_company_name?: string | null;
  paid_out_to_company_name?: string | null;
};

export type OpportunityParty = {
  id: number;
  opportunity_id: number;
  company_id: number;
  contact_id: number | null;
  role: string;
  partnership_mode: string | null;
  fee_note: string | null;
  collect_fee_amount: string | null;
  collect_fee_percent: string | null;
  paid_out_fee_amount: string | null;
  paid_out_fee_percent: string | null;
  collect_fee_status: FeeStatus | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  company_name?: string | null;
  contact_name?: string | null;
};

export type MarketablePropertyStatus =
  | "available"
  | "proposed"
  | "leased"
  | "sold"
  | "withdrawn"
  | "archived";

/** Inventory property — marketable space within a building (`properties` table). */
export type MarketableProperty = {
  id: number;
  building_id: number;
  floor: string | null;
  unit: string | null;
  property_category: string;
  operating_model: string;
  listing_intent: ListingIntent;
  space_form: string;
  occupancy_status: string | null;
  area_sqft: string | null;
  capacity_pax: number | null;
  operator_company_id: number | null;
  landlord_company_id: number | null;
  current_tenant_company_id: number | null;
  furniture: string | null;
  office_equipment: string | null;
  meeting_room: string | null;
  reception_service: string | null;
  it_network: string | null;
  move_in_status: string | null;
  view_type: string | null;
  fitout_condition: string | null;
  window_type: string | null;
  asking_rent: string | null;
  asking_sale_price: string | null;
  rent_psf: string | null;
  management_fee: string | null;
  deposit_months: number | null;
  rent_free_period: string | null;
  contract_term_months: number | null;
  commission_rate: string | null;
  available_date: string | null;
  specification: string | null;
  status: MarketablePropertyStatus;
  source: string | null;
  source_date: string | null;
  last_updated_date: string | null;
  remarks: string | null;
  external_ref: string | null;
  source_system: string | null;
  source_file: string | null;
  import_run_id: number | null;
  legacy_asset_id: number | null;
  legacy_inventory_id: number | null;
  created_at: string;
  updated_at: string;
  building_name?: string | null;
  building_district?: string | null;
};

export type MatchedProperty = {
  property_id: number;
  match_score: number;
  match_reasons: string[];
  match_gaps: string[];
  display_label: string;
  floor: string | null;
  unit: string | null;
  area_sqft: string | null;
  capacity_pax: number | null;
  building_name: string | null;
  building_district: string | null;
  property_category: string;
  operating_model: string;
  space_form: string;
  listing_intent: ListingIntent;
  asking_rent: string | null;
  asking_sale_price: string | null;
  available_date: string | null;
  property_status: MarketablePropertyStatus;
};

/** @deprecated Use MatchedProperty — legacy alias for inventory-based matching. */
export type MatchedOffer = {
  offer_id: number;
  match_score: number;
  match_reasons: string[];
  match_gaps: string[];
  asset_display_name: string | null;
  asset_floor: string | null;
  asset_unit: string | null;
  asset_net_area_sqft: string | null;
  asset_capacity_pax: number | null;
  building_name: string | null;
  building_district: string | null;
  offer_type: OfferType;
  listing_intent: ListingIntent;
  monthly_rent: string | null;
  sale_price: string | null;
  available_date: string | null;
  offer_status: InventoryStatus;
};
