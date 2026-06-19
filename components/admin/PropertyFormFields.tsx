import { FormField, TextAreaField } from "@/components/admin/AdminFormFields";
import {
  CENTRE_TYPES,
  LAND_USE_TYPES,
  OWNERSHIP_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from "@/lib/lookups";
import type { Property } from "@/lib/types/entities";

const selectClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

type Props = { defaults?: Property };

export function PropertyFormFields({ defaults }: Props) {
  return (
    <>
      <FormField label="Property / building name (EN)" name="name_en" defaultValue={defaults?.name_en} required />
      <FormField label="Property name (TC)" name="name_zh" defaultValue={defaults?.name_zh ?? ""} />
      <label className="block text-sm font-medium text-slate-700">
        Property type
        <select name="property_type" defaultValue={defaults?.property_type ?? "Commercial Building"} className={selectClass} required>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Centre type
        <select name="centre_type" defaultValue={defaults?.centre_type ?? ""} className={selectClass}>
          <option value="">— None —</option>
          {CENTRE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
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
        <FormField label="Lot number" name="lot_number" defaultValue={defaults?.lot_number ?? ""} />
        <label className="block text-sm font-medium text-slate-700">
          Land use
          <select name="land_use" defaultValue={defaults?.land_use ?? ""} className={selectClass}>
            <option value="">— None —</option>
            {LAND_USE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Ownership type
          <select name="ownership_type" defaultValue={defaults?.ownership_type ?? ""} className={selectClass}>
            <option value="">— None —</option>
            {OWNERSHIP_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <FormField label="Source URL / file" name="source_url" defaultValue={defaults?.source_url ?? ""} />
        <FormField label="Last verified" name="last_verified_date" type="date" defaultValue={defaults?.last_verified_date?.slice(0, 10) ?? ""} />
        <FormField label="Latitude" name="latitude" type="number" defaultValue={defaults?.latitude?.toString() ?? ""} />
        <FormField label="Longitude" name="longitude" type="number" defaultValue={defaults?.longitude?.toString() ?? ""} />
      </div>
      <label className="block text-sm font-medium text-slate-700">
        Record status
        <select name="status" defaultValue={defaults?.status ?? "active"} className={selectClass}>
          {PROPERTY_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
      <TextAreaField label="Remarks" name="remarks" defaultValue={defaults?.remarks ?? ""} />
    </>
  );
}
