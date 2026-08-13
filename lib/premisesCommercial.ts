import { formatMoney, formatPsf, formatCurrencyPsf } from "@/lib/formatCurrency";
import { isListingIntentForSale } from "@/lib/premisesListing";

const PACKAGE_OPERATING_MODELS = new Set([
  "Serviced Office",
  "Shared Office",
  "serviced_office",
  "shared_sublet_office",
]);

export const YES_NO_OPTIONS = ["Yes", "No"] as const;

/** Offers for serviced / shared office premises. */
export const SERVICED_OFFICE_OFFERS = ["Private Rooms", "Open Desk", "Virtual Address"] as const;
export type ServicedOfficeOffer = (typeof SERVICED_OFFICE_OFFERS)[number];

/** @deprecated Kept for legacy DB columns / migration compatibility. */
export const SERVICED_OFFICE_PRICE_TIERS = [
  {
    key: "unique_address",
    label: "Virtual Address",
    mthField: "price_pax_mth_unique_address",
    yrField: "price_pax_yr_unique_address",
  },
  {
    key: "workstation",
    label: "Workstation",
    mthField: "price_pax_mth_workstation",
    yrField: "price_pax_yr_workstation",
  },
  {
    key: "room_window",
    label: "Room Window",
    mthField: "price_pax_mth_room_window",
    yrField: "price_pax_yr_room_window",
  },
  {
    key: "room_internal",
    label: "Room Internal",
    mthField: "price_pax_mth_room_internal",
    yrField: "price_pax_yr_room_internal",
  },
] as const;

export type ServicedOfficePriceTierKey = (typeof SERVICED_OFFICE_PRICE_TIERS)[number]["key"];
export type ServicedOfficePriceField =
  | (typeof SERVICED_OFFICE_PRICE_TIERS)[number]["mthField"]
  | (typeof SERVICED_OFFICE_PRICE_TIERS)[number]["yrField"];

export function parsePackageOffers(raw: string | null | undefined): ServicedOfficeOffer[] {
  if (!raw?.trim()) return [];
  const allowed = new Set<string>(SERVICED_OFFICE_OFFERS);
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter((s): s is ServicedOfficeOffer => allowed.has(s));
}

export function formatPackageOffers(values: readonly string[]): string | null {
  const allowed = new Set<string>(SERVICED_OFFICE_OFFERS);
  const joined = values.map((v) => v.trim()).filter((v) => allowed.has(v)).join(", ");
  return joined || null;
}

export function isServicedOfficeOffer(value: string | null | undefined): value is ServicedOfficeOffer {
  return (SERVICED_OFFICE_OFFERS as readonly string[]).includes((value ?? "").trim());
}

export function isPackageOperatingModel(operatingModel: string | null | undefined): boolean {
  return PACKAGE_OPERATING_MODELS.has((operatingModel ?? "").trim());
}

/** Serviced office / shared-sublet office product (package pricing + per-pax tiers). */
export function isServicedOrSharedOffice(premises: {
  product_subtype?: string | null;
  operating_model?: string | null;
}): boolean {
  const subtype = (premises.product_subtype ?? "").trim();
  if (subtype === "serviced_office" || subtype === "shared_sublet_office") return true;
  return isPackageOperatingModel(premises.operating_model) || isPackageOperatingModel(subtype);
}

export function parseYesNo(value: unknown): "Yes" | "No" | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  if (s === "Yes" || s === "No") return s;
  const lower = s.toLowerCase();
  if (lower === "y" || lower === "true" || lower === "1") return "Yes";
  if (lower === "n" || lower === "false" || lower === "0") return "No";
  return null;
}

export function isServicedOfficePriceTierKey(value: string | null | undefined): value is ServicedOfficePriceTierKey {
  return SERVICED_OFFICE_PRICE_TIERS.some((tier) => tier.key === value);
}

export function servicedOfficePriceTierColumn(
  tier: ServicedOfficePriceTierKey,
  period: "mth" | "yr",
): ServicedOfficePriceField {
  const row = SERVICED_OFFICE_PRICE_TIERS.find((t) => t.key === tier)!;
  return period === "mth" ? row.mthField : row.yrField;
}

export function isConventionalOperatingModel(operatingModel: string | null | undefined): boolean {
  return (operatingModel ?? "").trim() === "Conventional";
}

export function monthlyRentFieldLabel(operatingModel: string | null | undefined): string {
  return isPackageOperatingModel(operatingModel) ? "Package monthly fee" : "Monthly rent";
}

export function packageFeesNote(operatingModel: string | null | undefined): string | null {
  if (!isPackageOperatingModel(operatingModel)) return null;
  return "Serviced / shared office: package fee in monthly rent. Management fee and government rates are 0.";
}

export function getPremisesRowPriceDisplay(
  row: {
    inventory_status: string | null;
    monthly_rent: string | null;
    rent_psf: string | null;
    asking_sale_price: string | null;
    sale_price_psf: string | null;
    currency: string | null;
  },
  options?: { psfAsCurrency?: boolean },
): { price: string; psf: string } {
  const currency = row.currency ?? "HKD";
  const formatPsfValue = options?.psfAsCurrency ? formatCurrencyPsf : formatPsf;
  if (isListingIntentForSale(row.inventory_status)) {
    return {
      price: formatMoney(row.asking_sale_price, currency),
      psf: formatPsfValue(row.sale_price_psf, currency),
    };
  }
  return {
    price: formatMoney(row.monthly_rent, currency),
    psf: formatPsfValue(row.rent_psf, currency),
  };
}
