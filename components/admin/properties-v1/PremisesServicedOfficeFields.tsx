"use client";

import { InlineSelectField, InlineTextField } from "@/components/admin/inline/InlineFields";
import { PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import {
  isServicedOrSharedOffice,
  SERVICED_OFFICE_PRICE_TIERS,
  YES_NO_OPTIONS,
} from "@/lib/premisesCommercial";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

type SaveFn = (field: string) => (value: unknown) => Promise<{ ok: boolean; error?: string }>;

export function PremisesServicedOfficeFields({
  premises,
  save,
}: {
  premises: PremisesV1;
  save: SaveFn;
}) {
  if (!isServicedOrSharedOffice(premises)) return null;

  return (
    <PremisesSectionCard title="Serviced / shared office" className="!p-3">
      <p className="mb-2 text-xs text-slate-500">
        Unique address = dedicated room number per company. Stamp duty = available for stamp duty registration.
      </p>
      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <InlineSelectField
          label="Unique Address?"
          value={premises.offers_unique_address}
          options={YES_NO_OPTIONS.map((value) => ({ value, label: value }))}
          onSave={save("offers_unique_address")}
        />
        <InlineSelectField
          label="Stamp Duty?"
          value={premises.offers_stamp_duty}
          options={YES_NO_OPTIONS.map((value) => ({ value, label: value }))}
          onSave={save("offers_stamp_duty")}
        />
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Price/pax/mth</th>
              <th className="px-3 py-2">Price/pax/yr</th>
            </tr>
          </thead>
          <tbody>
            {SERVICED_OFFICE_PRICE_TIERS.map((tier) => (
              <tr key={tier.key} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-800">{tier.label}</td>
                <td className="px-3 py-1.5">
                  <InlineTextField
                    label={`${tier.label} price/pax/mth`}
                    hideLabel
                    value={premises[tier.mthField]}
                    type="number"
                    onSave={save(tier.mthField)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <InlineTextField
                    label={`${tier.label} price/pax/yr`}
                    hideLabel
                    value={premises[tier.yrField]}
                    type="number"
                    onSave={save(tier.yrField)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PremisesSectionCard>
  );
}
