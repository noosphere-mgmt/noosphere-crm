"use client";

import Link from "next/link";
import { PropertyInlineOverview } from "@/components/admin/properties-v1/PropertyInlineOverview";
import { PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import { buildingFullPageHref } from "@/lib/crmDetailNav";
import { composeAddressEnglish, hasAddressParts } from "@/lib/composeAddress";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { PropertyV1 } from "@/lib/repos/propertiesV1";

function propertyAddressLine(property: PropertyV1): string | null {
  const parts = {
    streetNo: property.street_no,
    streetName: property.street_name_en,
    district: property.district_en,
    city: property.city_en,
  };
  if (hasAddressParts(parts)) return composeAddressEnglish(parts);
  return property.full_address_en?.trim() || property.full_address_zh?.trim() || null;
}

export function PremisesBuildingTab({
  property,
  companies,
}: {
  property: PropertyV1 | null;
  companies: CompanyV1Option[];
}) {
  if (!property) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        No building linked to this premises.
      </p>
    );
  }

  const buildingHref = buildingFullPageHref(property.business_id ?? property.property_id);
  const address = propertyAddressLine(property);
  const title = property.bldg_name_en?.trim() || property.property_id;

  return (
    <div className="space-y-4">
      <PremisesSectionCard title="Building">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-900">{title}</p>
            {property.business_id ? (
              <p className="mt-0.5 font-mono text-xs text-slate-500">{property.business_id}</p>
            ) : null}
            {address ? <p className="mt-2 text-sm text-slate-600">{address}</p> : null}
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              {property.grade ? (
                <div>
                  <dt className="text-xs text-slate-500">Grade</dt>
                  <dd className="font-medium text-slate-800">{property.grade}</dd>
                </div>
              ) : null}
              {property.year_built ? (
                <div>
                  <dt className="text-xs text-slate-500">Year built</dt>
                  <dd className="font-medium text-slate-800">{property.year_built}</dd>
                </div>
              ) : null}
              {property.inventory_count != null ? (
                <div>
                  <dt className="text-xs text-slate-500">Premises count</dt>
                  <dd className="font-medium text-slate-800">{property.inventory_count}</dd>
                </div>
              ) : null}
            </dl>
          </div>
          {buildingHref ? (
            <Link
              href={buildingHref}
              className="shrink-0 rounded-lg border border-blue-700 px-3 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-50"
            >
              Open building workspace →
            </Link>
          ) : null}
        </div>
      </PremisesSectionCard>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Building details</h3>
        <PropertyInlineOverview property={property} companies={companies} />
      </section>
    </div>
  );
}
