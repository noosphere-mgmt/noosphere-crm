"use client";

import { patchPremisesFieldAction } from "@/app/admin/properties/actions";
import { InlineTextAreaField, InlineTextField } from "@/components/admin/inline/InlineFields";
import { PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import { PremisesServicedOfficeFields } from "@/components/admin/properties-v1/PremisesServicedOfficeFields";
import { isServicedOrSharedOffice, monthlyRentFieldLabel } from "@/lib/premisesCommercial";
import { isListingIntentForLease, isListingIntentForSale } from "@/lib/premisesListing";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

export function PremisesCommercialTermsTab({ premises }: { premises: PremisesV1 }) {
  const save = (field: string) => async (value: unknown) => {
    const result = await patchPremisesFieldAction(premises.premises_id, field, JSON.stringify(value));
    return { ok: result.ok, error: result.ok ? undefined : result.error };
  };
  const showSale = premises.market_mode === "sale" || premises.market_mode === "lease_or_sale" || isListingIntentForSale(premises.inventory_status);
  const showLease = premises.market_mode === "lease" || premises.market_mode === "lease_or_sale" || isListingIntentForLease(premises.inventory_status) || !showSale;
  const packageOffice = isServicedOrSharedOffice(premises);
  return (
    <div className="contents">
      <PremisesServicedOfficeFields premises={premises} save={save} />
      {showLease ? (
        <PremisesSectionCard title="Lease Terms" className="!p-3">
          <div className="grid grid-cols-2 gap-2.5">
            {!packageOffice ? (
              <InlineTextField label={monthlyRentFieldLabel(premises.product_subtype ?? premises.operating_model)} value={premises.monthly_rent} type="number" onSave={save("monthly_rent")} />
            ) : null}
            <InlineTextField label="Rent PSF" value={premises.rent_psf} type="number" onSave={save("rent_psf")} />
            <InlineTextField label="Deposit" value={premises.deposit_months} onSave={save("deposit_months")} />
            <InlineTextField label="Rent-free period" value={premises.rent_free_period} onSave={save("rent_free_period")} />
            <InlineTextField label="Contract term (months)" value={premises.contract_term_months?.toString() ?? null} type="number" onSave={save("contract_term_months")} />
            <div className="col-span-2">
              <InlineTextAreaField label="Premises remarks" value={premises.remarks} onSave={save("remarks")} singleColumn />
            </div>
          </div>
        </PremisesSectionCard>
      ) : null}
      {showSale ? (
        <PremisesSectionCard title="Sales Terms" className="!p-3">
          <div className="grid grid-cols-2 gap-2.5">
            <InlineTextField label="Asking price" value={premises.asking_sale_price} type="number" onSave={save("asking_sale_price")} />
            <InlineTextField label="Asking price PSF" value={premises.sale_price_psf} type="number" onSave={save("sale_price_psf")} />
            <InlineTextField label="Negotiated price" value={premises.negotiable_sale_price} type="number" onSave={save("negotiable_sale_price")} />
            <InlineTextField label="Negotiated price PSF" value={premises.negotiable_sale_price_psf} type="number" onSave={save("negotiable_sale_price_psf")} />
            {!showLease ? (
              <div className="col-span-2">
                <InlineTextAreaField label="Premises remarks" value={premises.remarks} onSave={save("remarks")} singleColumn />
              </div>
            ) : null}
          </div>
        </PremisesSectionCard>
      ) : null}
    </div>
  );
}
