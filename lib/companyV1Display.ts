import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import { isLegacyNumericRef, isV1CompanyRef } from "@/lib/entityRefGuards";

export type CompanyV1SelectOption = {
  /** Legacy companies.id as string — form option value */
  value: string;
  label: string;
  v1Id: string;
  legacyId: number;
};

/** Dropdown options: value = legacy numeric id, label = name (COMP-*). */
export function toCompanyV1SelectOptions(companies: CompanyV1Option[]): CompanyV1SelectOption[] {
  return companies
    .filter((c) => c.legacy_company_id != null)
    .map((c) => {
      const legacyId = c.legacy_company_id!;
      const name = c.company_name_en?.trim() || c.company_id;
      return {
        value: String(legacyId),
        label: `${name} (${c.company_id})`,
        v1Id: c.company_id,
        legacyId,
      };
    });
}

/** Map stored DB value (COMP-* or legacy numeric) to select option value. */
export function coerceCompanyIdToSelectValue(
  stored: string | null | undefined,
  options: CompanyV1SelectOption[],
): string {
  const id = stored?.trim();
  if (!id) return "";
  if (options.some((o) => o.value === id)) return id;
  const byV1 = options.find((o) => o.v1Id === id);
  if (byV1) return byV1.value;
  if (isLegacyNumericRef(id)) return id;
  if (isV1CompanyRef(id)) {
    const match = options.find((o) => o.v1Id === id);
    if (match) return match.value;
  }
  return "";
}

export function buildCompanyV1LabelMap(companies: CompanyV1Option[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of companies) {
    const name = c.company_name_en?.trim() || c.company_id;
    const label = `${name} (${c.company_id})`;
    map.set(c.company_id, label);
    if (c.legacy_company_id != null) {
      map.set(String(c.legacy_company_id), label);
    }
  }
  return map;
}

export function labelCompanyV1(
  labels: Map<string, string>,
  companyId: string | null | undefined,
  resolvedLabels?: Map<string, string>,
  selectOptions?: CompanyV1SelectOption[],
): string {
  const id = companyId?.trim();
  if (!id) return "—";

  if (selectOptions?.length) {
    const byV1 = selectOptions.find((o) => o.v1Id === id);
    if (byV1) return byV1.label;
    const byLegacy = selectOptions.find((o) => o.value === id);
    if (byLegacy) return byLegacy.label;
  }

  if (resolvedLabels?.has(id)) return resolvedLabels.get(id)!;
  return labels.get(id) ?? resolvedLabels?.get(id) ?? id;
}

/** Merge resolved label lookups (raw id/name keys) into a base option map. */
export function mergeCompanyLabelMaps(
  base: Map<string, string>,
  resolved: Map<string, string>,
): Map<string, string> {
  return new Map([...base, ...resolved]);
}
