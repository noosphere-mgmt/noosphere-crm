import { isPackageOperatingModel } from "@/lib/premisesCommercial";
import type { PremisesV1, PremisesV1Patch } from "@/lib/repos/premisesV1";
import {
  V1_FIT_OUT_CONDITIONS,
  V1_LISTING_INTENTS,
  V1_LISTING_STATUSES,
  V1_OPERATING_MODELS,
  V1_VIEW_TYPES,
} from "@/lib/v1ListValues";

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
      const view = mustBeIn(value, V1_VIEW_TYPES);
      if (value && !view) return { error: "Invalid view type" };
      patch.view_type = view;
      break;
    }
    case "gross_area_sqft":
      patch.gross_area_sqft = numOrNull(value);
      break;
    case "workstation_count":
      patch.workstation_count = strOrNull(value);
      break;
    case "monthly_rent":
      patch.monthly_rent = numOrNull(value);
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
    case "available_date":
      patch.available_date = strOrNull(value);
      break;
    default:
      return { error: `Field "${field}" cannot be edited inline` };
  }

  return patch;
}
