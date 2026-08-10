"use client";

import Link from "next/link";
import { IconPen, IconX } from "@/components/admin/ModuleActionIcons";
import { moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { composeAddressEnglish, hasAddressParts } from "@/lib/composeAddress";
import { buildingWorkspaceHref } from "@/lib/buildingWorkspaceNav";
import type { PropertyV1 } from "@/lib/repos/propertiesV1";

function propertyTitle(property: PropertyV1): string {
  return property.bldg_name_en?.trim() || property.property_id;
}

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

export function BuildingWorkspaceHeader({
  property,
  premisesCount,
}: {
  property: PropertyV1;
  premisesCount: number;
}) {
  const theme = moduleAccentClasses("properties");
  const address = propertyAddressLine(property);

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href="/admin/properties" className={`text-xs font-medium ${theme.link}`}>
            ← All Premises
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {propertyTitle(property)}
          </h1>
          <RecordBusinessId id={property.business_id} className="mt-0.5 block" />
          {address ? (
            <p className="mt-2 text-sm text-slate-600">{address}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Address will appear when location fields are filled.</p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            {premisesCount} premises · Click a field to edit inline
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {property.grade ? <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">{property.grade}</span> : null}
            {property.title ? <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800">{property.title}</span> : null}
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">{premisesCount} {premisesCount === 1 ? "premise" : "premises"}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Link
            href={`/admin/properties/premises/new?property_id=${encodeURIComponent(property.property_id)}`}
            className={theme.primaryButton}
          >
            + Premises
          </Link>
          <Link
            href={buildingWorkspaceHref(property, "activities")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Log activity
          </Link>
          <Link
            href={buildingWorkspaceHref(property, "overview", "edit")}
            scroll={false}
            className={moduleEditButtonClass("properties")}
            aria-label="Edit building"
            title="Edit building"
          >
            <IconPen />
          </Link>
          <Link
            href="/admin/properties"
            className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
            title="Close"
          >
            <IconX />
          </Link>
        </div>
      </div>
    </div>
  );
}
