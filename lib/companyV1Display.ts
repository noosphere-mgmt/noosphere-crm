import { asArray } from "@/lib/asArray";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import { isPermanentBusinessId } from "@/lib/businessIds";

export type CompanyV1SelectOption = {
  /** Permanent business ID (C100001) — form option value */
  value: string;
  label: string;
  businessId: string;
  v1Id: string;
  legacyId: number | null;
};

/** Dropdown options: value = business_id, label = name (C100001). */
export function toCompanyV1SelectOptions(companies: CompanyV1Option[] | null | undefined): CompanyV1SelectOption[] {
  return asArray<CompanyV1Option>(companies)
    .filter((c) => c.business_id)
    .map((c) => {
      const businessId = c.business_id!;
      const name = c.company_name_en?.trim() || businessId;
      return {
        value: businessId,
        label: `${name} (${businessId})`,
        businessId,
        v1Id: c.company_id,
        legacyId: c.legacy_company_id,
      };
    });
}

/** Map stored DB value (any known ref) to permanent business ID for selects. */
export function coerceCompanyIdToSelectValue(
  stored: string | null | undefined,
  options: CompanyV1SelectOption[],
): string {
  const id = stored?.trim();
  if (!id) return "";
  if (options.some((o) => o.value === id)) return id;
  const byBusiness = options.find((o) => o.businessId === id);
  if (byBusiness) return byBusiness.value;
  const byV1 = options.find((o) => o.v1Id === id);
  if (byV1) return byV1.value;
  const byLegacy = options.find((o) => o.legacyId != null && String(o.legacyId) === id);
  if (byLegacy) return byLegacy.value;
  if (isPermanentBusinessId("company", id)) return id;
  return "";
}

export function buildCompanyV1LabelMap(companies: CompanyV1Option[] | null | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of asArray<CompanyV1Option>(companies)) {
    if (!c.business_id) continue;
    const name = c.company_name_en?.trim() || c.business_id;
    const label = `${name} (${c.business_id})`;
    map.set(c.business_id, label);
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
    const byBusiness = selectOptions.find((o) => o.businessId === id || o.value === id);
    if (byBusiness) return byBusiness.label;
    const byV1 = selectOptions.find((o) => o.v1Id === id);
    if (byV1) return byV1.label;
    const byLegacy = selectOptions.find((o) => o.legacyId != null && String(o.legacyId) === id);
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
