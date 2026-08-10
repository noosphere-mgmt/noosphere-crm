import { formatMoney } from "@/lib/formatCurrency";
import type { Opportunity } from "@/lib/types/entities";
import type { ProposalPricingSnapshot } from "@/lib/types/entities";

export type NetEffectiveRentInput = {
  monthly_rent: string | number | null | undefined;
  rent_psf: string | number | null | undefined;
  rent_free_period: string | null | undefined;
  contract_term_months: number | null | undefined;
  management_fee: string | number | null | undefined;
  deposit_months: string | null | undefined;
  asking_sale_price: string | number | null | undefined;
  currency?: string | null;
};

function parseNum(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number.parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Parse rent-free text such as "2 months" or "2". */
export function parseRentFreeMonths(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const m = value.trim().match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number.parseFloat(m[1]!);
  return Number.isFinite(n) ? n : null;
}

function resolveTermMonths(
  contractTermMonths: number | null | undefined,
  opportunity: Opportunity,
): number {
  if (contractTermMonths != null && contractTermMonths > 0) return contractTermMonths;
  const leaseTerm = opportunity.lease_term?.trim();
  if (leaseTerm) {
    const m = leaseTerm.match(/(\d+)/);
    if (m) {
      const n = Number.parseInt(m[1]!, 10);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return 36;
}

export function computeNetEffectiveRent(
  premises: NetEffectiveRentInput,
  opportunity: Opportunity,
): Pick<
  ProposalPricingSnapshot,
  | "face_rent"
  | "face_rent_psf"
  | "rent_free_months"
  | "term_months"
  | "management_fee"
  | "deposit_months"
  | "net_effective_rent"
  | "total_initial_cost"
  | "asking_sale_price"
  | "currency"
  | "display_rent"
> {
  const currency = premises.currency?.trim() || "HKD";
  const faceRent = parseNum(premises.monthly_rent);
  const faceRentPsf = parseNum(premises.rent_psf);
  const salePrice = parseNum(premises.asking_sale_price);
  const managementFee = parseNum(premises.management_fee) ?? 0;
  const depositMonths = parseNum(premises.deposit_months);
  const rentFreeMonths = parseRentFreeMonths(premises.rent_free_period) ?? 0;
  const termMonths = resolveTermMonths(premises.contract_term_months, opportunity);
  const salesRole = opportunity.sales_role ?? "to_lease";

  if ((salesRole === "to_buy" || salesRole === "to_sell") && salePrice != null) {
    return {
      face_rent: null,
      face_rent_psf: null,
      rent_free_months: null,
      term_months: null,
      management_fee: null,
      deposit_months: null,
      net_effective_rent: null,
      total_initial_cost: salePrice,
      asking_sale_price: salePrice,
      currency,
      display_rent: formatMoney(salePrice, currency),
    };
  }

  let netEffectiveRent: number | null = null;
  let totalInitialCost: number | null = null;

  if (faceRent != null && termMonths > 0) {
    const chargeableMonths = Math.max(termMonths - rentFreeMonths, 0);
    netEffectiveRent =
      (faceRent * chargeableMonths + managementFee * termMonths) / termMonths;
    const deposit = depositMonths != null ? faceRent * depositMonths : faceRent * 2;
    totalInitialCost = deposit + faceRent;
  }

  const displayRent =
    faceRent != null ? `${formatMoney(faceRent, currency)}/mo` : salePrice != null ? formatMoney(salePrice, currency) : "—";

  return {
    face_rent: faceRent,
    face_rent_psf: faceRentPsf,
    rent_free_months: rentFreeMonths || null,
    term_months: termMonths,
    management_fee: managementFee || null,
    deposit_months: depositMonths,
    net_effective_rent: netEffectiveRent != null ? Math.round(netEffectiveRent * 100) / 100 : null,
    total_initial_cost: totalInitialCost != null ? Math.round(totalInitialCost * 100) / 100 : null,
    asking_sale_price: salePrice,
    currency,
    display_rent: displayRent,
  };
}

export function buildPricingSnapshot(
  premises: NetEffectiveRentInput,
  opportunity: Opportunity,
  overrides?: ProposalPricingSnapshot["overrides"],
): ProposalPricingSnapshot {
  const computed = computeNetEffectiveRent(premises, opportunity);
  const displayRent = overrides?.display_rent?.trim() || computed.display_rent;
  const ner =
    overrides?.net_effective_rent != null
      ? overrides.net_effective_rent
      : computed.net_effective_rent;

  return {
    computed_at: new Date().toISOString(),
    sales_role: opportunity.sales_role ?? null,
    ...computed,
    display_rent: displayRent,
    overrides: overrides ?? {},
  };
}
