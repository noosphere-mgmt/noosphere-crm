"use client";

import { patchPremisesFieldAction } from "@/app/admin/properties/actions";
import { InlineSelectField, InlineTextAreaField, InlineTextField } from "@/components/admin/inline/InlineFields";
import { PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import { PREMISES_AVAILABILITY_STATUSES, PREMISES_CENTRE_STATUSES, PREMISES_MARKET_MODES, PREMISES_SOURCE_TYPES } from "@/lib/v1ListValues";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

const MARKET_MODE_OPTIONS = [
  ...PREMISES_MARKET_MODES,
  { value: "lease_or_sale", label: "Lease & Sale" },
] as const;

const CENTRE_STATUS_OPTIONS = PREMISES_CENTRE_STATUSES.map((v) => ({ value: v, label: v }));

export function PremisesAvailabilityTab({ premises }: { premises: PremisesV1 }) {
  const save = (field: string) => async (value: unknown) => {
    const result = await patchPremisesFieldAction(premises.premises_id, field, JSON.stringify(value));
    return { ok: result.ok, error: result.ok ? undefined : result.error };
  };
  return (
    <div className="grid gap-3">
      <PremisesSectionCard title="Listing" className="!p-3">
        <div className="grid grid-cols-2 gap-2.5">
          <InlineSelectField label="Market Mode" value={premises.market_mode ?? "lease"} options={[...MARKET_MODE_OPTIONS]} onSave={save("market_mode")} />
          <InlineSelectField label="Listing Status" value={premises.availability_status ?? "available"} options={[...PREMISES_AVAILABILITY_STATUSES]} onSave={save("availability_status")} />
          <InlineSelectField label="Centre status" value={premises.centre_status ?? "Active"} options={CENTRE_STATUS_OPTIONS} onSave={save("centre_status")} />
          <InlineSelectField label="Source Type" value={premises.source_type ?? "direct"} options={[...PREMISES_SOURCE_TYPES]} onSave={save("source_type")} />
          <InlineTextField label="Available Date" value={premises.available_date?.slice(0, 10) ?? null} type="date" onSave={save("available_date")} />
          <InlineTextField label="Management fee" value={premises.management_fee} type="number" onSave={save("management_fee")} />
          <InlineTextField label="Mgmt fee psf" value={premises.management_fee_psf} type="number" onSave={save("management_fee_psf")} />
          <InlineTextField label="Govt Rates (Month)" value={premises.government_rates} type="number" onSave={save("government_rates")} />
          <InlineTextField label="Last verified" value={premises.last_verified_date?.slice(0, 10) ?? null} type="date" onSave={save("last_verified_date")} />
          <div className="col-span-2">
            <InlineTextAreaField label="Listing remarks" value={premises.listing_remarks} onSave={save("listing_remarks")} />
          </div>
        </div>
      </PremisesSectionCard>
    </div>
  );
}
