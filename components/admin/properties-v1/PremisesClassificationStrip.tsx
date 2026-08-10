"use client";

import Link from "next/link";
import { getPremisesRowPriceDisplay } from "@/lib/premisesCommercial";
import { formatAreaSqft } from "@/lib/formatCurrency";
import {
  formatListingStatus,
  normalizeListingIntent,
} from "@/lib/premisesListing";
import { CANONICAL_LISTING_INTENT_LABELS, PREMISES_ASSET_CLASSES, PREMISES_ASSET_SCOPES, PREMISES_AVAILABILITY_STATUSES, PREMISES_MARKET_MODES, PREMISES_PRODUCT_SUBTYPES } from "@/lib/v1ListValues";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

function StripCell({
  label,
  value,
  empty = "—",
}: {
  label: string;
  value: string | null | undefined;
  empty?: string;
}) {
  const display = value?.trim() || empty;
  const muted = display === empty;
  return (
    <div className="min-w-[5.5rem] flex-1 px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-sm font-medium ${muted ? "text-slate-400" : "text-slate-900"}`}>{display}</dd>
    </div>
  );
}

export function PremisesClassificationStrip({ premises }: { premises: PremisesV1 }) {
  const labelFor = (rows: readonly { value: string; label: string }[], value?: string | null) => rows.find((row) => row.value === value)?.label ?? value ?? null;
  const category = labelFor(PREMISES_ASSET_CLASSES, premises.asset_class) ?? premises.property_category?.trim() ?? null;
  const spaceForm = labelFor(PREMISES_ASSET_SCOPES, premises.asset_scope) ?? premises.space_form?.trim() ?? null;
  const subtypeRows = premises.asset_class && premises.asset_class in PREMISES_PRODUCT_SUBTYPES
    ? PREMISES_PRODUCT_SUBTYPES[premises.asset_class as keyof typeof PREMISES_PRODUCT_SUBTYPES]
    : PREMISES_PRODUCT_SUBTYPES.unknown;
  const subtype = labelFor(subtypeRows, premises.product_subtype);
  const leaseSale =
    labelFor(PREMISES_MARKET_MODES, premises.market_mode) ?? (premises.listing_intent &&
    CANONICAL_LISTING_INTENT_LABELS[
      premises.listing_intent as keyof typeof CANONICAL_LISTING_INTENT_LABELS
    ]
      ? CANONICAL_LISTING_INTENT_LABELS[
          premises.listing_intent as keyof typeof CANONICAL_LISTING_INTENT_LABELS
        ]
      : normalizeListingIntent(premises.inventory_status));

  const sizeParts: string[] = [];
  if (premises.gross_area_sqft?.trim()) {
    sizeParts.push(formatAreaSqft(premises.gross_area_sqft));
  } else if (premises.capacity_pax != null) {
    sizeParts.push(`${premises.capacity_pax} pax`);
  }
  const size = sizeParts.length > 0 ? sizeParts.join(" · ") : null;

  const pricing = getPremisesRowPriceDisplay(premises);
  const pricingDisplay =
    pricing.price !== "—"
      ? pricing.psf !== "—"
        ? `${pricing.price} · ${pricing.psf}`
        : pricing.price
      : null;

  const availabilityParts: string[] = [];
  if (premises.available_date?.trim()) {
    availabilityParts.push(`From ${premises.available_date.slice(0, 10)}`);
  }
  if (premises.offer_status?.trim()) {
    availabilityParts.push(formatListingStatus(premises.offer_status));
  }
  const availabilityStatus = labelFor(PREMISES_AVAILABILITY_STATUSES, premises.availability_status);
  if (availabilityStatus) availabilityParts.unshift(availabilityStatus);
  const availability = availabilityParts.length > 0 ? availabilityParts.join(" · ") : null;

  const hasAny = category || spaceForm || subtype || leaseSale || size || pricingDisplay || availability;

  if (!hasAny) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-2.5">
        <p className="text-sm text-slate-500">
          Classification and pricing not set. Edit on Overview to improve matching and proposals.
        </p>
      </div>
    );
  }

  return (
    <dl className="flex flex-wrap divide-x divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
      <StripCell label="Asset class" value={category} />
      <StripCell label="Scope" value={spaceForm} />
      <StripCell label="Product" value={subtype} />
      <StripCell label="Market mode" value={leaseSale} />
      <StripCell label="Size" value={size} />
      <StripCell label="Pricing" value={pricingDisplay} />
      <StripCell label="Availability" value={availability} />
    </dl>
  );
}
