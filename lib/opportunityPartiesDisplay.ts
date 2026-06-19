import type { OpportunityParty } from "@/lib/types/entities";
import { OPPORTUNITY_PARTY_ROLE_LABELS, OPPORTUNITY_PARTY_SUMMARY_SLOTS } from "@/lib/opportunityValues";
import { formatMoney } from "@/lib/formatCurrency";

export function partyRoleLabel(role: string): string {
  return OPPORTUNITY_PARTY_ROLE_LABELS[role] ?? role;
}

export function findPartyForSummarySlot(
  parties: OpportunityParty[],
  slot: { role: string; aliases?: string[] },
): OpportunityParty | undefined {
  const roles = [slot.role, ...(slot.aliases ?? [])];
  return parties.find((p) => roles.includes(p.role));
}

export function formatPartySummaryLine(party: OpportunityParty | undefined): string {
  if (!party) return "—";
  const contact = party.contact_name ? ` · ${party.contact_name}` : "";
  return `${party.company_name ?? "—"}${contact}`;
}

export function formatPartyFeeCell(
  amount: string | null | undefined,
  percent: string | null | undefined,
): string {
  const parts: string[] = [];
  if (amount && String(amount).trim()) parts.push(formatMoney(amount));
  if (percent && String(percent).trim()) {
    const n = Number.parseFloat(String(percent));
    parts.push(Number.isFinite(n) ? `${n}%` : `${percent}%`);
  }
  return parts.join(" · ") || "—";
}

export function partiesSummaryRows(parties: OpportunityParty[]) {
  return OPPORTUNITY_PARTY_SUMMARY_SLOTS.map((slot) => ({
    label: slot.label,
    value: formatPartySummaryLine(findPartyForSummarySlot(parties, slot)),
  }));
}

export type OpportunityFeeSummary = {
  expected_collect: number;
  confirmed_collect: number;
  paid_out: number;
  net_fee: number;
  by_party: {
    party_id: number;
    company_id: number;
    company_name: string;
    role: string;
    collect: number;
    paid_out: number;
  }[];
};

function parseAmount(value: string | null | undefined): number {
  if (value == null || String(value).trim() === "") return 0;
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

const CONFIRMED_COLLECT_STATUSES = new Set(["confirmed", "invoiced", "paid"]);

export function summarizePartyFees(parties: OpportunityParty[]): OpportunityFeeSummary {
  let expected_collect = 0;
  let confirmed_collect = 0;
  let paid_out = 0;

  const by_party = parties.map((party) => {
    const collect = parseAmount(party.collect_fee_amount);
    const paid = parseAmount(party.paid_out_fee_amount);
    const status = party.collect_fee_status ?? "expected";

    if (status === "expected") expected_collect += collect;
    if (CONFIRMED_COLLECT_STATUSES.has(status)) confirmed_collect += collect;
    paid_out += paid;

    return {
      party_id: party.id,
      company_id: party.company_id,
      company_name: party.company_name ?? `Company #${party.company_id}`,
      role: party.role,
      collect,
      paid_out: paid,
    };
  });

  return {
    expected_collect,
    confirmed_collect,
    paid_out,
    net_fee: confirmed_collect - paid_out,
    by_party,
  };
}
