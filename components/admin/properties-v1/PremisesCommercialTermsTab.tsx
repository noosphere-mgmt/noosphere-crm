"use client";

import { patchPremisesFieldAction } from "@/app/admin/properties/actions";
import { InlineTextField } from "@/components/admin/inline/InlineFields";
import { PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import { monthlyRentFieldLabel } from "@/lib/premisesCommercial";
import { isListingIntentForLease, isListingIntentForSale } from "@/lib/premisesListing";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

export function PremisesCommercialTermsTab({ premises }: { premises: PremisesV1 }) {
  const save = (field: string) => async (value: unknown) => {
    const result = await patchPremisesFieldAction(premises.premises_id, field, JSON.stringify(value));
    return { ok: result.ok, error: result.ok ? undefined : result.error };
  };
  const showSale = premises.market_mode === "sale" || premises.market_mode === "lease_or_sale" || isListingIntentForSale(premises.inventory_status);
  const showLease = premises.market_mode === "lease" || premises.market_mode === "lease_or_sale" || isListingIntentForLease(premises.inventory_status) || !showSale;
  return (
    <div className="contents">
      {showLease ? (
        <PremisesSectionCard title="Lease Terms" className="!p-3">
          <div className="grid grid-cols-2 gap-2.5">
            <InlineTextField label={monthlyRentFieldLabel(premises.product_subtype ?? premises.operating_model)} value={premises.monthly_rent} type="number" onSave={save("monthly_rent")} />
            <InlineTextField label="Rent PSF" value={premises.rent_psf} type="number" onSave={save("rent_psf")} />
            <InlineTextField label="Deposit" value={premises.deposit_months} onSave={save("deposit_months")} />
            <InlineTextField label="Rent-free period" value={premises.rent_free_period} onSave={save("rent_free_period")} />
            <InlineTextField label="Contract term (months)" value={premises.contract_term_months?.toString() ?? null} type="number" onSave={save("contract_term_months")} />
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
          </div>
        </PremisesSectionCard>
      ) : null}
    </div>
  );
}
