"use client";

import {
  PremisesMetric,
  PremisesSectionCard,
  PremisesSnapshotChip,
} from "@/components/admin/properties-v1/premisesDrawerUi";
import {
  RelatedLink,
  type PremisesInlineOverviewProps,
} from "@/components/admin/properties-v1/premisesInlineOverviewShared";
import { usePremisesInlineOverview } from "@/components/admin/properties-v1/usePremisesInlineOverview";
import {
  InlineSelectField,
  InlineTextField,
} from "@/components/admin/inline/InlineFields";
import { formatMoney, formatPsf } from "@/lib/formatCurrency";
import { formatPremisesName } from "@/lib/premisesDisplay";
import { isPackageOperatingModel } from "@/lib/premisesCommercial";
import { formatListingStatus } from "@/lib/premisesListing";
import { PREMISES_NO_BUILDING_LABEL } from "@/lib/premisesDetailDisplay";
import {
  V1_FIT_OUT_CONDITIONS,
  V1_LISTING_INTENTS,
  V1_LISTING_STATUSES,
  V1_OPERATING_MODELS,
  V1_VIEW_TYPES,
} from "@/lib/v1ListValues";

export function PremisesInlineOverviewDesktop({
  premises,
  buildingName,
  propertyOptions,
  companies,
  relatedCounts,
  companyLabels,
  lastActivityDate,
  drawerBasePath = "/admin/properties",
}: PremisesInlineOverviewProps) {
  const {
    currency,
    rentLabel,
    feesNote,
    listingIntent,
    forLease,
    forSale,
    companyOptions,
    coerceCompanyId,
    propertySelectOptions,
    save,
    tabHref,
  } = usePremisesInlineOverview(premises, propertyOptions, companies, companyLabels, drawerBasePath);

  return (
    <div className="space-y-4">
      <PremisesSectionCard title="Building link">
        <InlineSelectField
          label="Linked building"
          value={premises.property_id}
          options={propertySelectOptions}
          onSave={save("property_id")}
          placeholder={PREMISES_NO_BUILDING_LABEL}
        />
      </PremisesSectionCard>

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
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <InlineSelectField
            label="Listing intent"
            value={premises.inventory_status}
            options={V1_LISTING_INTENTS.map((v) => ({ value: v, label: v }))}
            onSave={save("inventory_status")}
          />
          <InlineSelectField
            label="Listing status"
            value={premises.offer_status}
            options={V1_LISTING_STATUSES.map((v) => ({ value: v, label: formatListingStatus(v) }))}
            onSave={save("offer_status")}
          />
          <InlineTextField label="Floor" value={premises.floor} onSave={save("floor")} />
          <InlineTextField label="Unit" value={premises.unit} onSave={save("unit")} />
          <InlineSelectField
            label="Operating model"
            value={premises.operating_model}
            options={V1_OPERATING_MODELS.map((v) => ({ value: v, label: v }))}
            onSave={save("operating_model")}
          />
          <InlineSelectField
            label="Fit out"
            value={premises.fit_out_condition}
            options={V1_FIT_OUT_CONDITIONS.map((v) => ({ value: v, label: v }))}
            onSave={save("fit_out_condition")}
          />
        </div>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-white/80 bg-white/70 px-3 py-2">
            <InlineTextField
              label="Gross area (sq ft)"
              value={premises.gross_area_sqft}
              type="number"
              onSave={save("gross_area_sqft")}
            />
          </div>
          <div className="rounded-lg border border-white/80 bg-white/70 px-3 py-2">
            <InlineTextField label="Desks" value={premises.workstation_count} onSave={save("workstation_count")} />
          </div>
          <div className="rounded-lg border border-white/80 bg-white/70 px-3 py-2">
            <InlineSelectField
              label="View"
              value={premises.view_type}
              options={V1_VIEW_TYPES.map((v) => ({ value: v, label: v }))}
              onSave={save("view_type")}
            />
          </div>
          <div className="rounded-lg border border-white/80 bg-white/70 px-3 py-2">
            <InlineSelectField
              label="Operator company"
              value={coerceCompanyId(premises.operator_company_id) || null}
              options={companyOptions}
              onSave={save("operator_company_id")}
              placeholder="— Select company —"
            />
          </div>
          <div className="rounded-lg border border-white/80 bg-white/70 px-3 py-2">
            <InlineSelectField
              label="Owner company"
              value={coerceCompanyId(premises.owner_company_id) || null}
              options={companyOptions}
              onSave={save("owner_company_id")}
              placeholder="— Select company —"
            />
          </div>
          <div className="rounded-lg border border-white/80 bg-white/70 px-3 py-2">
            <InlineTextField
              label="Last verified"
              value={premises.last_verified_date?.slice(0, 10) ?? null}
              type="date"
              onSave={save("last_verified_date")}
            />
          </div>
          {lastActivityDate ? (
            <PremisesMetric label="Last activity" value={lastActivityDate.slice(0, 10)} />
          ) : null}
        </dl>
      </PremisesSectionCard>

      {forLease ? (
        <PremisesSectionCard title="Pricing / lease terms">
          <div className="grid gap-3 sm:grid-cols-2">
            <InlineTextField
              label={rentLabel}
              value={premises.monthly_rent}
              type="number"
              onSave={save("monthly_rent")}
            />
            <InlineTextField label="Rent PSF" value={premises.rent_psf} type="number" onSave={save("rent_psf")} />
            {!isPackageOperatingModel(premises.operating_model) ? (
              <>
                <InlineTextField
                  label="Management fee"
                  value={premises.management_fee}
                  type="number"
                  onSave={save("management_fee")}
                />
                <InlineTextField
                  label="Government rates"
                  value={premises.government_rates}
                  type="number"
                  onSave={save("government_rates")}
                />
              </>
            ) : (
              <>
                <PremisesMetric label="Management fee" value={formatMoney(0, currency)} />
                <PremisesMetric label="Government rates" value={formatMoney(0, currency)} />
              </>
            )}
          </div>
          {feesNote ? <p className="mt-3 text-xs text-slate-600">{feesNote}</p> : null}
          <p className="mt-2 text-xs text-slate-500">
            Display: {formatMoney(premises.monthly_rent, currency)} · {formatPsf(premises.rent_psf, currency)} PSF
          </p>
        </PremisesSectionCard>
      ) : null}

      {forSale ? (
        <PremisesSectionCard title="Sale pricing">
          <div className="grid gap-3 sm:grid-cols-2">
            <InlineTextField
              label="Asking sale price"
              value={premises.asking_sale_price}
              type="number"
              onSave={save("asking_sale_price")}
            />
            <InlineTextField
              label="Asking sale price PSF"
              value={premises.sale_price_psf}
              type="number"
              onSave={save("sale_price_psf")}
            />
          </div>
        </PremisesSectionCard>
      ) : null}

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
