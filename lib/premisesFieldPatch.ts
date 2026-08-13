import {
  formatPackageOffers,
  isPackageOperatingModel,
  parseYesNo,
  SERVICED_OFFICE_PRICE_TIERS,
  YES_NO_OPTIONS,
} from "@/lib/premisesCommercial";
import { formatPremisesViewTypes, parsePremisesViewTypes } from "@/lib/premisesDisplay";
import type { PremisesV1, PremisesV1Patch } from "@/lib/repos/premisesV1";
import {
  parseCanonicalListingIntent,
  parsePropertyCategory,
  parseSpaceForm,
} from "@/lib/premisesClassification";
import {
  V1_FIT_OUT_CONDITIONS,
  V1_LISTING_INTENTS,
  V1_LISTING_STATUSES,
  V1_OPERATING_MODELS,
  V1_VIEW_TYPES,
} from "@/lib/v1ListValues";

const SERVICED_PRICE_FIELDS = new Set<string>(
  SERVICED_OFFICE_PRICE_TIERS.flatMap((tier) => [tier.mthField, tier.yrField]),
);

function strOrNull(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s || null;
}

function numOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function intOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

function mustBeIn<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  const s = strOrNull(value);
  if (!s) return null;
  return (allowed as readonly string[]).includes(s) ? (s as T) : null;
}

export function applyPremisesFieldPatch(
  premises: PremisesV1,
  field: string,
  value: unknown,
): PremisesV1Patch | { error: string } {
  const patch: PremisesV1Patch = {};

  switch (field) {
    case "property_id": {
      const id = strOrNull(value);
      if (!id) return { error: "Select a building" };
      patch.property_id = id;
      break;
    }
    case "floor":
      patch.floor = strOrNull(value);
      break;
    case "unit":
      patch.unit = strOrNull(value);
      break;
    case "inventory_status": {
      const intent = mustBeIn(value, V1_LISTING_INTENTS);
      if (value && !intent) return { error: "Invalid listing intent" };
      patch.inventory_status = intent;
      break;
    }
    case "property_category": {
      const category = parsePropertyCategory(value);
      if (value && !category) return { error: "Invalid property category" };
      patch.property_category = category;
      break;
    }
    case "asset_class":
    case "asset_scope":
    case "product_subtype":
    case "whole_asset_type":
    case "market_mode":
    case "occupancy_status":
    case "availability_status":
    case "discovery_status":
    case "access_status":
    case "source_type":
    case "address_confidence":
    case "last_verified_at":
      patch[field] = strOrNull(value);
      break;
    case "space_form": {
      const form = parseSpaceForm(value);
      if (value && !form) return { error: "Invalid space form" };
      patch.space_form = form;
      break;
    }
    case "listing_intent": {
      const intent = parseCanonicalListingIntent(value);
      if (value && !intent) return { error: "Invalid listing intent (use lease, sale, or both)" };
      patch.listing_intent = intent;
      break;
    }
    case "offer_status": {
      const status = mustBeIn(value, V1_LISTING_STATUSES);
      if (value && !status) return { error: "Invalid listing status" };
      patch.offer_status = status;
      break;
    }
    case "operating_model": {
      const model = mustBeIn(value, V1_OPERATING_MODELS);
      if (value && !model) return { error: "Invalid operating model" };
      patch.operating_model = model;
      if (isPackageOperatingModel(model)) {
        patch.management_fee = 0;
        patch.government_rates = 0;
      }
      break;
    }
    case "fit_out_condition": {
      const condition = mustBeIn(value, V1_FIT_OUT_CONDITIONS);
      if (value && !condition) return { error: "Invalid fit out condition" };
      patch.fit_out_condition = condition;
      break;
    }
    case "view_type": {
      if (Array.isArray(value)) {
        const valid = value
          .map(String)
          .filter((v) => (V1_VIEW_TYPES as readonly string[]).includes(v));
        patch.view_type = formatPremisesViewTypes(valid);
      } else {
        const parts = parsePremisesViewTypes(strOrNull(value));
        const valid = parts.filter((v) => (V1_VIEW_TYPES as readonly string[]).includes(v));
        if (value && valid.length === 0) return { error: "Invalid view type" };
        patch.view_type = formatPremisesViewTypes(valid);
      }
      break;
    }
    case "gross_area_sqft":
      patch.gross_area_sqft = numOrNull(value);
      patch.gross_area_sqm = patch.gross_area_sqft == null ? null : Math.round((patch.gross_area_sqft / 10.7639) * 100) / 100;
      break;
    case "net_area_sqft":
      patch.net_area_sqft = numOrNull(value);
      patch.net_area_sqm = patch.net_area_sqft == null ? null : Math.round((patch.net_area_sqft / 10.7639) * 100) / 100;
      break;
    case "gross_area_sqm":
      patch.gross_area_sqm = numOrNull(value);
      patch.gross_area_sqft = patch.gross_area_sqm == null ? null : Math.round((patch.gross_area_sqm * 10.7639) * 100) / 100;
      break;
    case "net_area_sqm":
      patch.net_area_sqm = numOrNull(value);
      patch.net_area_sqft = patch.net_area_sqm == null ? null : Math.round((patch.net_area_sqm * 10.7639) * 100) / 100;
      break;
    case "no_of_rooms":
      patch.no_of_rooms = strOrNull(value);
      break;
    case "workstation_count":
      patch.workstation_count = strOrNull(value);
      break;
    case "monthly_rent":
      patch.monthly_rent = numOrNull(value);
      break;
    case "annual_rent":
      patch.annual_rent = numOrNull(value);
      break;
    case "rent_psf":
      patch.rent_psf = numOrNull(value);
      break;
    case "asking_sale_price":
      patch.asking_sale_price = numOrNull(value);
      break;
    case "sale_price_psf":
      patch.sale_price_psf = numOrNull(value);
      break;
    case "negotiable_sale_price":
      patch.negotiable_sale_price = numOrNull(value);
      break;
    case "negotiable_sale_price_psf":
      patch.negotiable_sale_price_psf = numOrNull(value);
      break;
    case "last_verified_date":
      patch.last_verified_date = strOrNull(value);
      break;
    case "listing_remarks":
      patch.listing_remarks = strOrNull(value);
      break;
    case "remarks":
      patch.remarks = strOrNull(value);
      break;
    case "management_fee":
      patch.management_fee = isPackageOperatingModel(premises.operating_model) ? 0 : numOrNull(value);
      break;
    case "management_fee_psf":
      patch.management_fee_psf = isPackageOperatingModel(premises.operating_model) ? 0 : numOrNull(value);
      break;
    case "government_rates":
      patch.government_rates = isPackageOperatingModel(premises.operating_model) ? 0 : numOrNull(value);
      break;
    case "operator_company_id":
    case "owner_company_id":
    case "landlord_company_id":
    case "current_tenant_company_id":
    case "source_company_id":
      patch[field] = strOrNull(value);
      break;
    case "contract_term_months":
      patch.contract_term_months = intOrNull(value);
      break;
    case "capacity_pax":
      patch.capacity_pax = intOrNull(value);
      break;
    case "offers_unique_address":
    case "offers_stamp_duty": {
      const yn = parseYesNo(value);
      if (value && !yn) return { error: "Use Yes or No" };
      if (yn && !(YES_NO_OPTIONS as readonly string[]).includes(yn)) {
        return { error: "Use Yes or No" };
      }
      patch[field] = yn;
      break;
    }
    case "package_offers":
      if (Array.isArray(value)) {
        patch.package_offers = formatPackageOffers(value.map(String));
      } else {
        patch.package_offers = formatPackageOffers(String(value ?? "").split(/[,;|]/));
      }
      break;
    case "deposit_months":
    case "rent_free_period":
    case "expected_commission":
    case "payout_commission":
    case "commission_remarks":
    case "source_url":
    case "source_file":
      patch[field] = strOrNull(value);
      break;
    case "available_date":
      patch.available_date = strOrNull(value);
      break;
    case "relationship_lines":
      // Handled specially in patchPremisesFieldAction (async normalize). Allow recognition here.
      if (!Array.isArray(value)) return { error: "Invalid relationship lines" };
      patch.relationship_lines = value as PremisesV1["relationship_lines"];
      break;
    default:
      if (SERVICED_PRICE_FIELDS.has(field)) {
        (patch as Record<string, unknown>)[field] = numOrNull(value);
        break;
      }
      return { error: `Field "${field}" cannot be edited inline` };
  }

  return patch;
}
