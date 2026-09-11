"use client";

import { CoverageMultiSelect } from "@/components/admin/connections/CoverageMultiSelect";
import { PROPERTY_SECTOR_OPTIONS } from "@/lib/connectionsValues";

export function PropertySectorMultiSelect({
  value,
  onChange,
  compact = false,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  compact?: boolean;
}) {
  return (
    <CoverageMultiSelect
      value={value}
      onChange={onChange}
      compact={compact}
      options={PROPERTY_SECTOR_OPTIONS}
      emptyLabel="Property Sector"
      clearLabel="Clear"
      allowSelectAll
    />
  );
}
