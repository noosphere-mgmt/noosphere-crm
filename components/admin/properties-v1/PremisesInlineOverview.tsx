"use client";

import { useCallback, useEffect, useState } from "react";
import { patchPremisesFieldAction } from "@/app/admin/properties/actions";
import {
  InlineMultiSelectField,
  InlineSelectField,
  InlineTextAreaField,
  InlineTextField,
} from "@/components/admin/inline/InlineFields";
import type { PremisesInlineOverviewProps } from "@/components/admin/properties-v1/premisesInlineOverviewShared";
import { PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import { usePremisesInlineOverview } from "@/components/admin/properties-v1/usePremisesInlineOverview";
import { parsePremisesViewTypes } from "@/lib/premisesDisplay";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import {
  PREMISES_ASSET_CLASSES,
  PREMISES_PRODUCT_SUBTYPES,
  SPACE_FORMS,
  V1_VIEW_TYPES,
} from "@/lib/v1ListValues";

const SQFT_PER_SQM = 10.7639;
const SPACE_FORM_OPTIONS = SPACE_FORMS.map((value) => ({ value, label: value }));

function convertedArea(value: unknown, direction: "to_sqm" | "to_sqft"): string | null {
  if (value == null || String(value).trim() === "") return null;
  const number = Number.parseFloat(String(value));
  if (!Number.isFinite(number)) return null;
  const converted = direction === "to_sqm" ? number / SQFT_PER_SQM : number * SQFT_PER_SQM;
  return converted.toFixed(2);
}

/** Overview contains only the premise's core physical facts and notes.
 * Market, pricing, availability, relationships and activity live in their dedicated tabs.
 */
export function PremisesInlineOverview({
  premises,
  propertyOptions,
  companies,
  companyLabels,
  drawerBasePath = "/admin/properties",
}: PremisesInlineOverviewProps) {
  const { save } = usePremisesInlineOverview(
    premises,
    propertyOptions,
    companies,
    companyLabels,
    drawerBasePath,
  );
  const subtypeOptions = premises.asset_class && premises.asset_class in PREMISES_PRODUCT_SUBTYPES
    ? PREMISES_PRODUCT_SUBTYPES[premises.asset_class as keyof typeof PREMISES_PRODUCT_SUBTYPES]
    : PREMISES_PRODUCT_SUBTYPES.other;
  const [grossSqft, setGrossSqft] = useState(premises.gross_area_sqft);
  const [grossSqm, setGrossSqm] = useState(premises.gross_area_sqm ?? null);
  const [netSqft, setNetSqft] = useState(premises.net_area_sqft);
  const [netSqm, setNetSqm] = useState(premises.net_area_sqm ?? null);

  useEffect(() => setGrossSqft(premises.gross_area_sqft), [premises.gross_area_sqft]);
  useEffect(() => setGrossSqm(premises.gross_area_sqm ?? null), [premises.gross_area_sqm]);
  useEffect(() => setNetSqft(premises.net_area_sqft), [premises.net_area_sqft]);
  useEffect(() => setNetSqm(premises.net_area_sqm ?? null), [premises.net_area_sqm]);

  async function saveArea(kind: "gross" | "net", unit: "sqft" | "sqm", value: unknown) {
    const result = await save(`${kind}_area_${unit}`)(value);
    if (!result.ok) return result;
    const ownValue = value == null || String(value).trim() === "" ? null : String(value);
    if (kind === "gross" && unit === "sqft") {
      setGrossSqft(ownValue);
      setGrossSqm(convertedArea(value, "to_sqm"));
    } else if (kind === "gross") {
      setGrossSqm(ownValue);
      setGrossSqft(convertedArea(value, "to_sqft"));
    } else if (unit === "sqft") {
      setNetSqft(ownValue);
      setNetSqm(convertedArea(value, "to_sqm"));
    } else {
      setNetSqm(ownValue);
      setNetSqft(convertedArea(value, "to_sqft"));
    }
    return result;
  }
  return (
    <div className="grid gap-3">
      <PremisesSectionCard title="Premises specification" className="!p-3">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <InlineSelectField
            label="Asset Class"
            value={premises.asset_class ?? null}
            options={[...PREMISES_ASSET_CLASSES]}
            onSave={save("asset_class")}
          />
          <InlineTextField label="Floor" value={premises.floor} onSave={save("floor")} />
          <InlineTextField label="Unit" value={premises.unit} onSave={save("unit")} />
          <InlineSelectField
            label="Subtype"
            value={premises.product_subtype ?? null}
            options={[...subtypeOptions]}
            onSave={save("product_subtype")}
          />
          <InlineSelectField
            label="Space Form"
            value={premises.space_form ?? null}
            options={SPACE_FORM_OPTIONS}
            onSave={save("space_form")}
          />
          <InlineMultiSelectField
            label="View"
            values={parsePremisesViewTypes(premises.view_type)}
            options={[...V1_VIEW_TYPES]}
            onSave={save("view_type")}
            colSpan={1}
          />
          <InlineTextField label="Gross Area (sq.ft.)" value={grossSqft} type="number" onSave={(value) => saveArea("gross", "sqft", value)} />
          <InlineTextField label="Net Area (sq.ft.)" value={netSqft} type="number" onSave={(value) => saveArea("net", "sqft", value)} />
          <InlineTextField label="No. of rooms" value={premises.no_of_rooms ?? premises.workstation_count} onSave={save("no_of_rooms")} />
          <InlineTextField label="Gross Area (sq.m.)" value={grossSqm} type="number" onSave={(value) => saveArea("gross", "sqm", value)} />
          <InlineTextField label="Net Area (sq.m.)" value={netSqm} type="number" onSave={(value) => saveArea("net", "sqm", value)} />
          <InlineTextField label="Capacity (pax)" value={premises.capacity_pax?.toString() ?? null} type="number" onSave={save("capacity_pax")} />
          <div className="col-span-2 sm:col-span-3">
            <InlineTextField label="Source URL" value={premises.source_url} onSave={save("source_url")} />
          </div>
        </div>
      </PremisesSectionCard>
    </div>
  );
}

export function PremisesInlineNotes({ premises }: { premises: PremisesV1 }) {
  const save = useCallback(
    (field: string) => async (value: unknown) => {
      const result = await patchPremisesFieldAction(premises.premises_id, field, JSON.stringify(value));
      return { ok: result.ok, error: result.ok ? undefined : result.error };
    },
    [premises.premises_id],
  );

  return (
    <PremisesSectionCard title="Notes">
      <div className="grid gap-3 sm:grid-cols-2">
        <InlineTextAreaField label="Premises remarks" value={premises.remarks} onSave={save("remarks")} />
        <InlineTextAreaField label="Listing remarks" value={premises.listing_remarks} onSave={save("listing_remarks")} />
      </div>
    </PremisesSectionCard>
  );
}
