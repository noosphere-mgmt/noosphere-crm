"use client";

import {
  InlineSelectField,
  InlineTextAreaField,
  InlineTextField,
} from "@/components/admin/inline/InlineFields";
import { PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import { usePropertyInlineOverview } from "@/components/admin/properties-v1/usePropertyInlineOverview";
import { BUILDING_GRADES, BUILDING_TITLES } from "@/lib/lookups";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { PropertyV1 } from "@/lib/repos/propertiesV1";

export function PropertyInlineOverviewDesktop({
  property,
  companies,
}: {
  property: PropertyV1;
  companies: CompanyV1Option[];
}) {
  const { companyOptions, save, addressEn, addressZh } = usePropertyInlineOverview(property, companies);

  return (
    <div className="space-y-4">
      <PremisesSectionCard title="Building">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InlineTextField label="Building name (EN)" value={property.bldg_name_en} onSave={save("bldg_name_en")} />
          <InlineTextField label="Building name (ZH)" value={property.bldg_name_zh} onSave={save("bldg_name_zh")} />
          <InlineTextField label="Building name (CN)" value={property.bldg_name_cn} onSave={save("bldg_name_cn")} />
        </div>
      </PremisesSectionCard>

      <PremisesSectionCard title="Building specification">
        <div className="grid gap-3 sm:grid-cols-2">
          <InlineTextField
            label="Year built"
            value={property.year_built?.toString() ?? null}
            type="number"
            onSave={save("year_built")}
          />
          <InlineTextField
            label="No. of floors"
            value={property.floor_count?.toString() ?? null}
            type="number"
            onSave={save("floor_count")}
          />
          <InlineSelectField
            label="Grade"
            value={property.grade}
            options={BUILDING_GRADES.map((g) => ({ value: g, label: g }))}
            onSave={save("grade")}
          />
          <InlineSelectField
            label="Title"
            value={property.title}
            options={BUILDING_TITLES.map((t) => ({ value: t, label: t }))}
            onSave={save("title")}
          />
        </div>
      </PremisesSectionCard>

      <PremisesSectionCard title="Location">
        <div className="mb-3 rounded-lg border border-white/80 bg-white/70 px-3 py-2 text-sm text-slate-800">
          <p>{addressEn || "—"}</p>
          {addressZh ? <p className="mt-1 text-slate-600">{addressZh}</p> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InlineTextField label="Country" value={property.country} onSave={save("country")} />
          <InlineTextField label="City (EN)" value={property.city_en} onSave={save("city_en")} />
          <InlineTextField label="District (EN)" value={property.district_en} onSave={save("district_en")} />
          <InlineTextField label="Street no." value={property.street_no} onSave={save("street_no")} />
          <InlineTextField label="Street (EN)" value={property.street_name_en} onSave={save("street_name_en")} />
        </div>
      </PremisesSectionCard>

      <PremisesSectionCard title="Companies">
        <div className="grid gap-3 sm:grid-cols-2">
          <InlineSelectField
            label="Management company"
            value={property.management_company_id}
            options={companyOptions}
            onSave={save("management_company_id")}
            placeholder="— Select company —"
          />
          <InlineSelectField
            label="Operator"
            value={property.operator_company_id}
            options={companyOptions}
            onSave={save("operator_company_id")}
            placeholder="— Select company —"
          />
          <InlineSelectField
            label="Current tenant"
            value={property.current_tenant_company_id}
            options={companyOptions}
            onSave={save("current_tenant_company_id")}
            placeholder="— Select company —"
          />
          <InlineSelectField
            label="Owner"
            value={property.owner_company_id}
            options={companyOptions}
            onSave={save("owner_company_id")}
            placeholder="— Select company —"
          />
        </div>
      </PremisesSectionCard>

      <PremisesSectionCard title="Accessibility">
        <div className="grid gap-3 sm:grid-cols-2">
          <InlineTextField label="MTR station" value={property.mtr_station} onSave={save("mtr_station")} />
          <InlineTextField
            label="Walking minutes"
            value={property.walking_minutes?.toString() ?? null}
            type="number"
            onSave={save("walking_minutes")}
          />
        </div>
      </PremisesSectionCard>

      <PremisesSectionCard title="Building notes">
        <div className="space-y-4">
          <InlineTextAreaField label="Building description" value={property.bldg_desc} onSave={save("bldg_desc")} />
          <InlineTextAreaField label="Building remarks" value={property.building_remarks} onSave={save("building_remarks")} />
          <InlineTextAreaField label="Facilities" value={property.facilities} onSave={save("facilities")} />
        </div>
      </PremisesSectionCard>
    </div>
  );
}
