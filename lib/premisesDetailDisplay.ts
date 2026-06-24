import { labelCompanyV1, type CompanyV1SelectOption } from "@/lib/companyV1Display";
import type { PropertyV1SelectOption } from "@/lib/repos/propertiesV1";

export const PREMISES_NO_BUILDING_LABEL = "No building linked";
export const PREMISES_NOT_ASSIGNED_LABEL = "Not assigned";
export const PREMISES_UNKNOWN_COMPANY_LABEL = "Unknown company";

export function formatPremisesBuildingLabel(
  buildingName: string | null | undefined,
  propertyId: string | null | undefined,
  propertyOptions: PropertyV1SelectOption[] = [],
): string {
  const fromOptions = propertyOptions.find((p) => p.property_id === propertyId)?.label;
  if (fromOptions?.trim()) return fromOptions.trim();
  if (buildingName?.trim()) return buildingName.trim();
  if (propertyId?.trim()) return propertyId.trim();
  return PREMISES_NO_BUILDING_LABEL;
}

export function formatPremisesOperatorLabel(
  companyLabels: Map<string, string>,
  operatorCompanyId: string | null | undefined,
  selectOptions?: CompanyV1SelectOption[],
): string {
  if (!operatorCompanyId?.trim()) return PREMISES_NOT_ASSIGNED_LABEL;
  const label = labelCompanyV1(companyLabels, operatorCompanyId, undefined, selectOptions);
  if (label === "—" || label === operatorCompanyId.trim()) {
    return PREMISES_UNKNOWN_COMPANY_LABEL;
  }
  return label;
}

export function formatPremisesRelationshipCompanyLabel(
  companyLabels: Map<string, string>,
  companyId: string | null | undefined,
  selectOptions?: CompanyV1SelectOption[],
): string {
  if (!companyId?.trim()) return "—";
  const label = labelCompanyV1(companyLabels, companyId, undefined, selectOptions);
  if (label === "—" || label === companyId.trim()) {
    return PREMISES_UNKNOWN_COMPANY_LABEL;
  }
  return label;
}

export function formatPremisesRelationshipContactLabel(
  contactLabels: Map<string, string>,
  contactId: string | null | undefined,
): string {
  if (!contactId?.trim()) return "—";
  return contactLabels.get(contactId.trim()) ?? contactId.trim();
}
