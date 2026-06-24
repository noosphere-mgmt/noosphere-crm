import { asArray } from "@/lib/asArray";
import { normalizePremisesRelationshipLines } from "@/lib/premisesRelationships";
import type { PremisesDrawerData } from "@/lib/repos/premisesDrawer";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import type { PremisesFeeLineRow, PremisesFeeSummary } from "@/lib/repos/opportunityProposedPremises";

export const EMPTY_PREMISES_FEE_SUMMARY: PremisesFeeSummary = {
  expected_collect: 0,
  confirmed_collect: 0,
  paid_out: 0,
  net_fee: 0,
  lines: [],
};

export const EMPTY_PREMISES_DRAWER_DATA: PremisesDrawerData = {
  proposed: [],
  fees: EMPTY_PREMISES_FEE_SUMMARY,
  activities: [],
  lastActivityDate: null,
};

export function normalizePremisesFeeSummary(fees: PremisesFeeSummary | null | undefined): PremisesFeeSummary {
  if (!fees || typeof fees !== "object") return EMPTY_PREMISES_FEE_SUMMARY;
  return {
    expected_collect: Number(fees.expected_collect) || 0,
    confirmed_collect: Number(fees.confirmed_collect) || 0,
    paid_out: Number(fees.paid_out) || 0,
    net_fee: Number(fees.net_fee) || 0,
    lines: asArray<PremisesFeeLineRow>(fees.lines),
  };
}

export function normalizePremisesDrawerData(data: PremisesDrawerData | null | undefined): PremisesDrawerData {
  if (!data || typeof data !== "object") return EMPTY_PREMISES_DRAWER_DATA;
  return {
    proposed: asArray(data.proposed),
    fees: normalizePremisesFeeSummary(data.fees),
    activities: asArray(data.activities),
    lastActivityDate: data.lastActivityDate ?? null,
  };
}

/** Client-safe premise record — relationship_lines always an array. */
export function normalizePremisesV1Client(premises: PremisesV1): PremisesV1 {
  return {
    ...premises,
    relationship_lines: normalizePremisesRelationshipLines(premises.relationship_lines),
  };
}

export function asCompanyV1Options(companies: CompanyV1Option[] | null | undefined): CompanyV1Option[] {
  return asArray<CompanyV1Option>(companies);
}

export function asContactV1Options(contacts: ContactV1Option[] | null | undefined): ContactV1Option[] {
  return asArray<ContactV1Option>(contacts);
}
