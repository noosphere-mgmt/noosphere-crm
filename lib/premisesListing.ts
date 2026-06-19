import type { PremisesFlatFilters } from "@/lib/repos/premisesV1";
import { V1_LISTING_INTENTS, V1_LISTING_STATUSES } from "@/lib/v1ListValues";

export type ListingIntent = (typeof V1_LISTING_INTENTS)[number];
export type ListingStatus = (typeof V1_LISTING_STATUSES)[number];

/** Normalize legacy inventory_status values to Listing Intent labels. */
export function normalizeListingIntent(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  if (raw === "For Lease" || raw === "For Sale") return raw;

  const lower = raw.toLowerCase();
  if (lower.includes("lease") || lower.includes("rent")) return "For Lease";
  if (lower.includes("sale")) return "For Sale";
  return raw;
}

export function isListingIntentForLease(value: string | null | undefined): boolean {
  return normalizeListingIntent(value) === "For Lease";
}

export function isListingIntentForSale(value: string | null | undefined): boolean {
  return normalizeListingIntent(value) === "For Sale";
}

export function formatListingStatus(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  return raw || "—";
}

export function getPremisesListPriceHeaderLabels(filters: PremisesFlatFilters): {
  price: string;
  psf: string;
} {
  if (filters.listing_intent === "For Lease") {
    return { price: "Monthly rent", psf: "Rent PSF" };
  }
  if (filters.listing_intent === "For Sale") {
    return { price: "Asking sale price", psf: "Sale PSF" };
  }
  return { price: "Rent / Sale price", psf: "Rent / Sale PSF" };
}
