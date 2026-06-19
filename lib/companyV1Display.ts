import type { CompanyV1Option } from "@/lib/repos/companiesV1";

export type CompanyV1SelectOption = { value: string; label: string };

export function toCompanyV1SelectOptions(companies: CompanyV1Option[]): CompanyV1SelectOption[] {
  return companies.map((c) => ({
    value: c.company_id,
    label: c.company_name_en?.trim() || c.company_id,
  }));
}

export function buildCompanyV1LabelMap(companies: CompanyV1Option[]): Map<string, string> {
  return new Map(
    companies.map((c) => [c.company_id, c.company_name_en?.trim() || c.company_id]),
  );
}

export function labelCompanyV1(
  labels: Map<string, string>,
  companyId: string | null | undefined,
  resolvedLabels?: Map<string, string>,
): string {
  const id = companyId?.trim();
  if (!id) return "—";
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
