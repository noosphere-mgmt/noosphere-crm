"use client";

import { useState, type ReactNode } from "react";
import {
  InlineSelectField,
  InlineTextAreaField,
  InlineTextField,
} from "@/components/admin/inline/InlineFields";
import { PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import { PropertyInlineAreaConversionFields } from "@/components/admin/properties-v1/PropertyInlineAreaConversionFields";
import { BuildingRelationshipsEditor } from "@/components/admin/properties-v1/BuildingRelationships";
import type { BuildingRelationshipLine } from "@/lib/buildingRelationships";
import { usePropertyInlineOverview } from "@/components/admin/properties-v1/usePropertyInlineOverview";
import { BUILDING_GRADES, BUILDING_TITLES, PROPERTY_TYPES } from "@/lib/lookups";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { PropertyV1 } from "@/lib/repos/propertiesV1";

function MobileCollapsibleSection({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {!open && summary ? <p className="mt-1 truncate text-xs text-slate-600">{summary}</p> : null}
        </div>
        <span className="shrink-0 text-xs font-medium text-slate-500">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? <div className="mt-3 space-y-3 border-t border-blue-100/80 pt-3">{children}</div> : null}
    </section>
  );
}

export function PropertyInlineOverviewMobile({
  property,
  companies,
  showMultilingualNames = false,
}: {
  property: PropertyV1;
  companies: CompanyV1Option[];
  showMultilingualNames?: boolean;
}) {
  const { companyOptions, save, locationSummary } = usePropertyInlineOverview(property, companies);

  return (
    <div className="space-y-3">
      <PremisesSectionCard title="Building">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <InlineTextField label="Building Name (English)" value={property.bldg_name_en} onSave={save("bldg_name_en")} />
          </div>
          {showMultilingualNames ? (
            <div className="col-span-2">
              <InlineTextField label="物業名稱（繁體中文）" value={property.bldg_name_zh} onSave={save("bldg_name_zh")} />
            </div>
          ) : null}
        </div>
      </PremisesSectionCard>

      <PremisesSectionCard title="Building specification">
        <div className="grid grid-cols-2 gap-3">
          <InlineSelectField
            label="Building Type"
            value={property.building_type}
            options={PROPERTY_TYPES.map((v) => ({ value: v, label: v }))}
            onSave={save("building_type")}
          />
          <InlineSelectField
            label="Grade"
            value={property.grade}
            options={BUILDING_GRADES.map((g) => ({ value: g, label: g }))}
            onSave={save("grade")}
          />
          <InlineTextField
            label="Year built"
            value={property.year_built?.toString() ?? null}
            type="number"
            useGrouping={false}
            onSave={save("year_built")}
          />
          <InlineTextField
            label="Total Floors"
            value={property.floor_count?.toString() ?? null}
            type="number"
            onSave={save("floor_count")}
          />
          <PropertyInlineAreaConversionFields fieldPrefix="bldg_area" label="Gross Area" sqftValue={property.bldg_area_sqft} sqmValue={property.bldg_area_sqm} save={save} />
          <div className="col-span-2">
            <InlineSelectField
              label="Title"
              value={property.title}
              options={BUILDING_TITLES.map((t) => ({ value: t, label: t }))}
              onSave={save("title")}
            />
          </div>
        </div>
      </PremisesSectionCard>

      <MobileCollapsibleSection title="Location" summary={locationSummary}>
        <div className="grid grid-cols-3 gap-2">
          <InlineTextField label="Country" value={property.country} onSave={save("country")} />
          <InlineTextField label="City" value={property.city_en} onSave={save("city_en")} />
          <InlineTextField label="District" value={property.district_en} onSave={save("district_en")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InlineTextField label="Street" value={property.street_name_en} onSave={save("street_name_en")} />
          <InlineTextField label="Street no." value={property.street_no} onSave={save("street_no")} />
        </div>
      </MobileCollapsibleSection>

      <MobileCollapsibleSection title="Site & planning" summary={[property.lot_number, property.land_use].filter(Boolean).join(" · ")}>
        <div className="grid grid-cols-2 gap-3">
          <InlineTextField label="Lot number" value={property.lot_number} onSave={save("lot_number")} />
          <InlineTextField label="Land Use / Zoning" value={property.land_use} onSave={save("land_use")} />
          <InlineTextField label="Class of site" value={property.class_of_site} onSave={save("class_of_site")} />
          <InlineTextField label="Land tenure" value={property.land_tenure} onSave={save("land_tenure")} />
          <InlineTextField label="Plot ratio" value={property.plot_ratio} type="number" onSave={save("plot_ratio")} />
          <PropertyInlineAreaConversionFields fieldPrefix="site_area" label="Site area" sqftValue={property.site_area_sqft} sqmValue={property.site_area_sqm} save={save} />
        </div>
      </MobileCollapsibleSection>

      <PremisesSectionCard title="Relationships">
        <BuildingRelationshipsEditor
          value={property.building_relationship_lines}
          companyOptions={companyOptions}
          onSave={async (lines: BuildingRelationshipLine[]) => {
            const result = await save("building_relationship_lines")(lines);
            return { ok: result.ok, error: result.error };
          }}
        />
      </PremisesSectionCard>

      <PremisesSectionCard title="Proposal content">
        <div className="grid grid-cols-2 gap-3">
          <InlineTextAreaField label="Building Introduction" value={property.bldg_desc} onSave={save("bldg_desc")} />
          <InlineTextAreaField label="Location Highlights" value={property.location_advantages_en} onSave={save("location_advantages_en")} />
          <InlineTextAreaField label="Accessibility & Transport" value={property.proposal_highlights_en} onSave={save("proposal_highlights_en")} />
          <InlineTextAreaField label="Facilities & Amenities" value={property.facilities} onSave={save("facilities")} />
        </div>
      </PremisesSectionCard>
    </div>
  );
}
