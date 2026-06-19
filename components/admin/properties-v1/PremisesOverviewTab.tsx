"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PremisesField,
  PremisesMetric,
  PremisesSectionCard,
  PremisesSnapshotChip,
} from "@/components/admin/properties-v1/premisesDrawerUi";
import { labelCompanyV1 } from "@/lib/companyV1Display";
import { formatMoney, formatPsf } from "@/lib/formatCurrency";
import { formatPremisesName, formatVerifiedDate } from "@/lib/premisesDisplay";
import {
  isPackageOperatingModel,
  monthlyRentFieldLabel,
  packageFeesNote,
} from "@/lib/premisesCommercial";
import {
  isListingIntentForLease,
  isListingIntentForSale,
  normalizeListingIntent,
  formatListingStatus,
} from "@/lib/premisesListing";
import { premisesDrawerHref } from "@/lib/premisesDrawerNav";
import type { PremisesDetailTabId } from "@/lib/premisesDetailTab";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

function display(v: string | number | null | undefined): string {
  if (v == null) return "—";
  const s = String(v).trim();
  return s || "—";
}

function formatDate(v: string | null | undefined): string {
  if (!v) return "—";
  return v.slice(0, 10);
}

function controllingParty(
  premises: PremisesV1,
  companyLabels: Map<string, string>,
): string {
  const operator = labelCompanyV1(companyLabels, premises.operator_company_id);
  if (operator !== "—") return operator;
  const owner = labelCompanyV1(companyLabels, premises.owner_company_id);
  if (owner !== "—") return owner;
  return labelCompanyV1(companyLabels, premises.landlord_company_id);
}

function RelatedLink({
  href,
  label,
  count,
}: {
  href: string;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-white/80 bg-white/70 px-3 py-2.5 text-sm font-medium text-blue-800 hover:bg-white hover:text-blue-900"
    >
      <span>{label}</span>
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-900">{count}</span>
    </Link>
  );
}

export function PremisesOverviewTab({
  premises,
  buildingName,
  relatedCounts,
  companyLabels,
  lastActivityDate,
  drawerBasePath = "/admin/properties",
}: {
  premises: PremisesV1;
  buildingName: string | null;
  relatedCounts?: { relationships: number; opportunities: number; fees: number };
  companyLabels: Map<string, string>;
  lastActivityDate?: string | null;
  drawerBasePath?: string;
}) {
  const searchParams = useSearchParams();
  const currency = premises.currency ?? "HKD";
  const rentLabel = monthlyRentFieldLabel(premises.operating_model);
  const feesNote = packageFeesNote(premises.operating_model);
  const listingIntent = normalizeListingIntent(premises.inventory_status);
  const forLease = isListingIntentForLease(premises.inventory_status);
  const forSale = isListingIntentForSale(premises.inventory_status);
  const controller = controllingParty(premises, companyLabels);

  function tabHref(tab: PremisesDetailTabId) {
    return premisesDrawerHref(searchParams, premises.premises_id, tab, "view", drawerBasePath);
  }

  return (
    <div className="space-y-4">
      <PremisesSectionCard title="Key snapshot">
        <p className="mb-3 text-base font-semibold text-slate-900">
          {formatPremisesName(buildingName, premises.floor, premises.unit)}
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {listingIntent ? <PremisesSnapshotChip>{listingIntent}</PremisesSnapshotChip> : null}
          {premises.operating_model ? <PremisesSnapshotChip>{premises.operating_model}</PremisesSnapshotChip> : null}
          {premises.fit_out_condition ? <PremisesSnapshotChip>{premises.fit_out_condition}</PremisesSnapshotChip> : null}
          {premises.offer_status ? <PremisesSnapshotChip>{formatListingStatus(premises.offer_status)}</PremisesSnapshotChip> : null}
        </div>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <PremisesMetric
            label="Gross area"
            value={premises.gross_area_sqft ? `${premises.gross_area_sqft} sq ft` : "—"}
          />
          <PremisesMetric label="Desks" value={display(premises.workstation_count)} />
          <PremisesMetric label="View" value={display(premises.view_type)} />
          <PremisesMetric label="Operator / owner" value={controller} />
          <PremisesMetric label="Last verified" value={formatVerifiedDate(premises.last_verified_date)} />
          {lastActivityDate ? (
            <PremisesMetric label="Last activity" value={formatDate(lastActivityDate)} />
          ) : null}
        </dl>
      </PremisesSectionCard>

      {forLease ? (
        <PremisesSectionCard title="Pricing / lease terms">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <PremisesField label={rentLabel} value={formatMoney(premises.monthly_rent, currency)} />
            <PremisesField label="Rent PSF" value={formatPsf(premises.rent_psf, currency)} />
            <PremisesField
              label="Management fee"
              value={
                isPackageOperatingModel(premises.operating_model)
                  ? formatMoney(0, currency)
                  : formatMoney(premises.management_fee, currency)
              }
            />
            <PremisesField
              label="Government rates"
              value={
                isPackageOperatingModel(premises.operating_model)
                  ? formatMoney(0, currency)
                  : formatMoney(premises.government_rates, currency)
              }
            />
            <PremisesField label="Deposit" value={display(premises.deposit_months)} />
            <PremisesField label="Rent-free period" value={display(premises.rent_free_period)} />
            <PremisesField
              label="Contract term"
              value={premises.contract_term_months != null ? `${premises.contract_term_months} months` : "—"}
            />
            <PremisesField label="Available date" value={formatDate(premises.available_date)} />
          </dl>
          {feesNote ? <p className="mt-3 text-xs text-slate-600">{feesNote}</p> : null}
        </PremisesSectionCard>
      ) : null}

      {forSale ? (
        <PremisesSectionCard title="Sale pricing">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <PremisesField label="Asking sale price" value={formatMoney(premises.asking_sale_price, currency)} />
            <PremisesField label="Asking sale price PSF" value={formatPsf(premises.sale_price_psf, currency)} />
            <PremisesField label="Negotiated sale price" value={formatMoney(premises.negotiable_sale_price, currency)} />
            <PremisesField
              label="Negotiated sale price PSF"
              value={formatPsf(premises.negotiable_sale_price_psf, currency)}
            />
          </dl>
        </PremisesSectionCard>
      ) : null}

      <PremisesSectionCard title="Commission">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <PremisesField label="Expected" value={formatMoney(premises.expected_commission, currency)} />
          <PremisesField label="Payout" value={formatMoney(premises.payout_commission, currency)} />
          {premises.commission_remarks?.trim() ? (
            <div className="col-span-2">
              <PremisesField label="Remarks" value={premises.commission_remarks.trim()} />
            </div>
          ) : null}
        </dl>
      </PremisesSectionCard>

      {relatedCounts ? (
        <PremisesSectionCard title="Related records">
          <div className="grid gap-2 sm:grid-cols-3">
            <RelatedLink href={tabHref("relationships")} label="Relationships" count={relatedCounts.relationships} />
            <RelatedLink href={tabHref("opportunities")} label="Opportunities" count={relatedCounts.opportunities} />
            <RelatedLink href={tabHref("fees")} label="Fees" count={relatedCounts.fees} />
            <RelatedLink href={tabHref("activities")} label="Activities" count={0} />
          </div>
        </PremisesSectionCard>
      ) : null}
    </div>
  );
}
