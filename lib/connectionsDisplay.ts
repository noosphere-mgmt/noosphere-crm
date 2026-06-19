import { CONNECTION_COMPANY_ROLE_LABELS } from "@/lib/connectionsValues";
import type { Company, CompanyRole } from "@/lib/types/entities";

export type ConnectionCompanyListRow = Company & {
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  open_opportunities: number;
};

export function formatCompanyRoles(roles: CompanyRole[]): string {
  return roles
    .map((r) => {
      const label = (CONNECTION_COMPANY_ROLE_LABELS as Record<string, string>)[r];
      if (label) return label;
      if (r === "property_management") return "Bldg Mgmt";
      if (r === "developer") return "Other";
      return r;
    })
    .join(", ");
}

export function formatCoverage(values: string[] | null | undefined): string {
  const list = (values ?? []).filter(Boolean);
  return list.length > 0 ? list.join(", ") : "—";
}

export function formatDateLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 10);
}
