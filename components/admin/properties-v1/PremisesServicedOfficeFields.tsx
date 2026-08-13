"use client";

import { InlineMultiSelectField, InlineTextField } from "@/components/admin/inline/InlineFields";
import { PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import {
  isServicedOrSharedOffice,
  parsePackageOffers,
  SERVICED_OFFICE_OFFERS,
} from "@/lib/premisesCommercial";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

type SaveFn = (field: string) => (value: unknown) => Promise<{ ok: boolean; error?: string }>;

function YesNoCheckbox({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string | null | undefined;
  onSave: (value: unknown) => Promise<{ ok: boolean; error?: string }>;
}) {
  const checked = value === "Yes";
  return (
    <label className="inline-flex min-h-[3.25rem] cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm font-medium text-slate-800">
      <input
        type="checkbox"
        className="rounded border-slate-300"
        checked={checked}
        onChange={(e) => {
          void onSave(e.target.checked ? "Yes" : "No");
        }}
      />
      {label}
    </label>
  );
}

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
      <div className="mb-3 grid grid-cols-1 items-stretch gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <InlineMultiSelectField
          label="Offers"
          values={parsePackageOffers(premises.package_offers)}
          options={[...SERVICED_OFFICE_OFFERS]}
          onSave={save("package_offers")}
          colSpan={1}
        />
        <YesNoCheckbox
          label="Stamp Duty"
          value={premises.offers_stamp_duty}
          onSave={save("offers_stamp_duty")}
        />
        <YesNoCheckbox
          label="Unique Address"
          value={premises.offers_unique_address}
          onSave={save("offers_unique_address")}
        />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <InlineTextField
          label="Monthly Rent"
          value={premises.monthly_rent}
          type="number"
          onSave={save("monthly_rent")}
        />
        <InlineTextField
          label="Annual Rent"
          value={premises.annual_rent}
          type="number"
          onSave={save("annual_rent")}
        />
      </div>
    </PremisesSectionCard>
  );
}
