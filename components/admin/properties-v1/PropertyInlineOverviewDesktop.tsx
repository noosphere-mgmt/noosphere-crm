"use client";

import {
  InlineSelectField,
  InlineTextAreaField,
  InlineTextField,
} from "@/components/admin/inline/InlineFields";
import { PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import { PropertyInlineAreaConversionFields } from "@/components/admin/properties-v1/PropertyInlineAreaConversionFields";
import { BuildingRelationshipsView } from "@/components/admin/properties-v1/BuildingRelationships";
import { usePropertyInlineOverview } from "@/components/admin/properties-v1/usePropertyInlineOverview";
import { BUILDING_GRADES, BUILDING_TITLES, PROPERTY_TYPES } from "@/lib/lookups";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { PropertyV1 } from "@/lib/repos/propertiesV1";

export function PropertyInlineOverviewDesktop({
  property,
  companies,
  showMultilingualNames = false,
}: {
  property: PropertyV1;
  companies: CompanyV1Option[];
  showMultilingualNames?: boolean;
}) {
  const { companyOptions, save, addressEn } = usePropertyInlineOverview(property, companies);

  return (
    <div className="grid items-start gap-3 lg:grid-cols-2">
      <PremisesSectionCard title="Building" className="!p-3 lg:col-span-2">
        <div className={showMultilingualNames ? "grid gap-2.5 lg:grid-cols-2" : undefined}>
          <InlineTextField label="Building Name (English)" value={property.bldg_name_en} onSave={save("bldg_name_en")} />
          {showMultilingualNames ? (
            <InlineTextField label="物業名稱（繁體中文）" value={property.bldg_name_zh} onSave={save("bldg_name_zh")} />
          ) : null}
        </div>
      </PremisesSectionCard>

      <PremisesSectionCard title="Building specification" className="!p-3">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <InlineSelectField label="Building Type" value={property.building_type} options={PROPERTY_TYPES.map((v) => ({ value: v, label: v }))} onSave={save("building_type")} />
          <InlineSelectField label="Grade" value={property.grade} options={BUILDING_GRADES.map((g) => ({ value: g, label: g }))} onSave={save("grade")} />
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
          <div className="sm:col-span-2">
            <InlineSelectField label="Title" value={property.title} options={BUILDING_TITLES.map((t) => ({ value: t, label: t }))} onSave={save("title")} />
          </div>
        </div>
      </PremisesSectionCard>

      <PremisesSectionCard title="Site" className="!p-3">
        <div className="grid grid-cols-2 gap-2.5">
          <InlineTextField label="Lot number" value={property.lot_number} onSave={save("lot_number")} />
          <InlineTextField label="Land Use / Zoning" value={property.land_use} onSave={save("land_use")} />
          <InlineTextField label="Class of site" value={property.class_of_site} onSave={save("class_of_site")} />
          <InlineTextField label="Land tenure" value={property.land_tenure} onSave={save("land_tenure")} />
          <InlineTextField label="Plot ratio" value={property.plot_ratio} type="number" onSave={save("plot_ratio")} />
          <PropertyInlineAreaConversionFields fieldPrefix="site_area" label="Site area" sqftValue={property.site_area_sqft} sqmValue={property.site_area_sqm} save={save} />
        </div>
      </PremisesSectionCard>

      <PremisesSectionCard title="Relationships" className="!p-3 lg:col-span-2">
        <BuildingRelationshipsView value={property.building_relationship_lines} companyOptions={companyOptions} />
      </PremisesSectionCard>

      <div>
      <PremisesSectionCard title="Location" className="!p-3">
        <div className="mb-2 rounded-lg border border-white/80 bg-white/70 px-3 py-2 text-sm text-slate-800">
          <p>{addressEn || ""}</p>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <InlineTextField label="Country" value={property.country} onSave={save("country")} />
          <InlineTextField label="City (EN)" value={property.city_en} onSave={save("city_en")} />
          <InlineTextField label="District (EN)" value={property.district_en} onSave={save("district_en")} />
          <InlineTextField label="Street (EN)" value={property.street_name_en} onSave={save("street_name_en")} />
          <InlineTextField label="Street no." value={property.street_no} onSave={save("street_no")} />
        </div>
      </PremisesSectionCard>
      </div>

      <div>
      <PremisesSectionCard title="Proposal content" className="!p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <InlineTextAreaField label="Building Introduction" value={property.bldg_desc} onSave={save("bldg_desc")} />
          <InlineTextAreaField label="Location Highlights" value={property.location_advantages_en} onSave={save("location_advantages_en")} />
          <InlineTextAreaField label="Accessibility & Transport" value={property.proposal_highlights_en} onSave={save("proposal_highlights_en")} />
          <InlineTextAreaField label="Facilities & Amenities" value={property.facilities} onSave={save("facilities")} />
        </div>
      </PremisesSectionCard>
      </div>
    </div>
  );
}
