"use client";

import { FormField, SelectField, TextAreaField } from "@/components/admin/AdminFormFields";
import {
  BUILDING_GRADES,
  CENTRE_TYPES,
  LAND_USE_TYPES,
  OWNERSHIP_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from "@/lib/lookups";
import type { Building } from "@/lib/types/entities";

type Props = { defaults?: Building };

export function BuildingFormFields({ defaults }: Props) {
  return (
    <>
      <FormField label="Building name (EN)" name="name_en" defaultValue={defaults?.name_en} required />
      <FormField label="Building name (TC)" name="name_zh" defaultValue={defaults?.name_zh ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tower / block" name="tower_block" defaultValue={defaults?.tower_block ?? ""} />
        <SelectField
          label="Building type"
          name="property_type"
          defaultValue={defaults?.property_type ?? "Commercial Building"}
          placeholder=""
          options={PROPERTY_TYPES}
        />
        <SelectField
          label="Centre type"
          name="centre_type"
          defaultValue={defaults?.centre_type ?? ""}
          placeholder="— None —"
          options={CENTRE_TYPES}
        />
        <SelectField
          label="Status"
          name="status"
          defaultValue={defaults?.status ?? "active"}
          placeholder=""
          options={PROPERTY_STATUSES}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Country" name="country" defaultValue={defaults?.country ?? "Hong Kong"} required />
        <FormField label="City" name="city" defaultValue={defaults?.city ?? "Hong Kong"} required />
        <FormField label="District" name="district" defaultValue={defaults?.district ?? ""} required />
        <FormField label="Street no." name="street_no" defaultValue={defaults?.street_no ?? ""} />
        <FormField label="Street name (EN)" name="street_name_en" defaultValue={defaults?.street_name_en ?? ""} />
        <FormField label="Street name (TC)" name="street_name_zh" defaultValue={defaults?.street_name_zh ?? ""} />
      </div>
      <FormField label="Full address (EN)" name="full_address_en" defaultValue={defaults?.full_address_en ?? ""} required />
      <FormField label="Full address (TC)" name="full_address_zh" defaultValue={defaults?.full_address_zh ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="No. of floors" name="floor_count" type="number" defaultValue={defaults?.floor_count?.toString() ?? ""} />
        <FormField label="Typical floor area (sq ft)" name="typical_floor_area_sqft" type="number" defaultValue={defaults?.typical_floor_area_sqft ?? ""} />
        <FormField label="Year built" name="year_built" type="number" defaultValue={defaults?.year_built?.toString() ?? ""} />
        <SelectField
          label="Building grade"
          name="grade"
          defaultValue={defaults?.grade ?? ""}
          placeholder="— None —"
          options={BUILDING_GRADES}
        />
        <FormField label="Nearest MTR" name="mtr_station" defaultValue={defaults?.mtr_station ?? ""} />
        <FormField label="Walking minutes" name="walking_minutes" type="number" defaultValue={defaults?.walking_minutes?.toString() ?? ""} />
        <FormField label="Green certification" name="green_certification" defaultValue={defaults?.green_certification ?? ""} />
        <FormField label="Lot number" name="lot_number" defaultValue={defaults?.lot_number ?? ""} />
        <SelectField
          label="Land use"
          name="land_use"
          defaultValue={defaults?.land_use ?? ""}
          placeholder="— None —"
          options={LAND_USE_TYPES}
        />
        <SelectField
          label="Ownership type"
          name="ownership_type"
          defaultValue={defaults?.ownership_type ?? ""}
          placeholder="— None —"
          options={OWNERSHIP_TYPES}
        />
        <FormField label="Latitude" name="latitude" type="number" defaultValue={defaults?.latitude?.toString() ?? ""} />
        <FormField label="Longitude" name="longitude" type="number" defaultValue={defaults?.longitude?.toString() ?? ""} />
      </div>
      <TextAreaField label="Building facilities" name="facilities" defaultValue={defaults?.facilities ?? ""} />
      <TextAreaField label="Building remarks" name="remarks" defaultValue={defaults?.remarks ?? ""} />
      {defaults?.property_id ? (
        <input type="hidden" name="legacy_property_id" value={defaults.property_id} />
      ) : null}
    </>
  );
}
