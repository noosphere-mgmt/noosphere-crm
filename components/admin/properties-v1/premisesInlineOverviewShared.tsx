"use client";

import Link from "next/link";
import { labelCompanyV1 } from "@/lib/companyV1Display";
import { PREMISES_NOT_ASSIGNED_LABEL } from "@/lib/premisesDetailDisplay";
import type { PremisesDetailTabId } from "@/lib/premisesDetailTab";
import type { PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

export type PremisesInlineOverviewProps = {
  premises: PremisesV1;
  buildingName: string | null;
  propertyOptions: PropertyV1SelectOption[];
  companies: CompanyV1Option[];
  relatedCounts?: { relationships: number; opportunities: number; fees: number };
  companyLabels: Map<string, string>;
  lastActivityDate?: string | null;
  drawerBasePath?: string;
};

export function controllingParty(
  premises: PremisesV1,
  companyLabels: Map<string, string>,
): string {
  const operatorId = premises.operator_company_id?.trim();
  if (operatorId) {
    const operator = labelCompanyV1(companyLabels, operatorId);
    if (operator !== "—" && operator !== operatorId) return operator;
  }
  const ownerId = premises.owner_company_id?.trim();
  if (ownerId) {
    const owner = labelCompanyV1(companyLabels, ownerId);
    if (owner !== "—" && owner !== ownerId) return owner;
  }
  const landlordId = premises.landlord_company_id?.trim();
  if (landlordId) {
    const landlord = labelCompanyV1(companyLabels, landlordId);
    if (landlord !== "—" && landlord !== landlordId) return landlord;
  }
  return PREMISES_NOT_ASSIGNED_LABEL;
}

export function RelatedLink({
  href,
  label,
  count,
}: {
  href: string;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-white/80 bg-white/70 px-2 py-2 text-xs font-medium text-blue-800 hover:bg-white hover:text-blue-900 sm:px-3 sm:py-2.5 sm:text-sm"
    >
      <span className="truncate">{label}</span>
      <span className="ml-1 shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-900 sm:px-2 sm:text-xs">
        {count}
      </span>
    </Link>
  );
}

export type PremisesTabHrefFn = (tab: PremisesDetailTabId) => string;
