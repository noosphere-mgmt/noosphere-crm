"use client";

import { useState, type ReactNode } from "react";
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
}: {
  property: PropertyV1;
  companies: CompanyV1Option[];
}) {
  const { companyOptions, save, locationSummary } = usePropertyInlineOverview(property, companies);

  return (
    <div className="space-y-3">
      <PremisesSectionCard title="Building">
        <div className="space-y-3">
          <InlineTextField label="Building name (EN)" value={property.bldg_name_en} onSave={save("bldg_name_en")} />
          <div className="grid grid-cols-2 gap-3">
            <InlineTextField label="Building name (ZH)" value={property.bldg_name_zh} onSave={save("bldg_name_zh")} />
            <InlineTextField label="Building name (CN)" value={property.bldg_name_cn} onSave={save("bldg_name_cn")} />
          </div>
        </div>
      </PremisesSectionCard>

      <PremisesSectionCard title="Building specification">
        <div className="grid grid-cols-2 gap-3">
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

      <MobileCollapsibleSection title="Location" summary={locationSummary}>
        <div className="grid grid-cols-3 gap-2">
          <InlineTextField label="Country" value={property.country} onSave={save("country")} />
          <InlineTextField label="City" value={property.city_en} onSave={save("city_en")} />
          <InlineTextField label="District" value={property.district_en} onSave={save("district_en")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InlineTextField label="Street no." value={property.street_no} onSave={save("street_no")} />
          <InlineTextField label="Street" value={property.street_name_en} onSave={save("street_name_en")} />
        </div>
      </MobileCollapsibleSection>

      <PremisesSectionCard title="Companies">
        <div className="grid grid-cols-2 gap-3">
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
        <div className="grid grid-cols-2 gap-3">
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
        <div className="grid grid-cols-2 gap-3">
          <InlineTextAreaField label="Building description" value={property.bldg_desc} onSave={save("bldg_desc")} />
          <InlineTextAreaField label="Building remarks" value={property.building_remarks} onSave={save("building_remarks")} />
          <div className="col-span-2">
            <InlineTextAreaField label="Facilities" value={property.facilities} onSave={save("facilities")} />
          </div>
        </div>
      </PremisesSectionCard>
    </div>
  );
}
