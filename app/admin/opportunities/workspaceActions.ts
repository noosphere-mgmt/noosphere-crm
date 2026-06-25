"use server";

import { revalidatePath } from "next/cache";
import {
  PROPOSED_PREMISES_PREFERENCES,
  PROPOSED_PREMISES_STATUSES,
  FEE_STATUSES,
  OPPORTUNITY_PARTY_ROLES,
} from "@/lib/opportunityValues";
import {
  addProposedPremises,
  deleteProposedPremisesLines,
  getProposedPremisesLine,
  patchProposedPremisesLine,
  updateProposedPremisesLine,
} from "@/lib/repos/opportunityProposedPremises";
import {
  createOpportunityParty,
  deleteOpportunityParty,
  updateOpportunityParty,
} from "@/lib/repos/opportunityParties";
import type {
  FeeStatus,
  ProposedPremisesPreference,
  ProposedPremisesStatus,
} from "@/lib/types/entities";
import {
  normalizeOptionalLegacyCompanyId,
  normalizeOptionalLegacyContactId,
} from "@/lib/crmRefResolve";

function parseOptionalString(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function parseOptionalId(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseOptionalDecimal(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalInt(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalPreference(v: FormDataEntryValue | null): ProposedPremisesPreference | null {
  const s = String(v ?? "").trim();
  return (PROPOSED_PREMISES_PREFERENCES as readonly string[]).includes(s)
    ? (s as ProposedPremisesPreference)
    : null;
}

function parseOptionalFeeStatus(v: FormDataEntryValue | null): FeeStatus | null {
  const s = String(v ?? "").trim();
  return (FEE_STATUSES as readonly string[]).includes(s) ? (s as FeeStatus) : null;
}

function parseEnum<T extends string>(v: FormDataEntryValue | null, allowed: readonly T[], fallback: T): T {
  const s = String(v ?? "").trim();
  return (allowed as readonly string[]).includes(s) ? (s as T) : fallback;
}

function revalidateOpportunity(opportunityId: number) {
  revalidatePath("/admin/opportunities");
  revalidatePath(`/admin/opportunities/${opportunityId}`);
}

export async function addProposedPremisesAction(opportunityId: number, formData: FormData) {
  const raw = String(formData.get("premises_ids") ?? "").trim();
  const premisesIds = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  await addProposedPremises(opportunityId, premisesIds);
  revalidateOpportunity(opportunityId);
}

export async function deleteProposedPremisesAction(opportunityId: number, formData: FormData) {
  const raw = String(formData.get("line_ids") ?? "").trim();
  const ids = raw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  await deleteProposedPremisesLines(ids);
  revalidateOpportunity(opportunityId);
}

export async function updateProposedPremisesLineAction(lineId: number, formData: FormData) {
  const opportunityId = parseOptionalInt(formData.get("opportunity_id"));
  if (!opportunityId) throw new Error("Missing opportunity_id");

  await updateProposedPremisesLine(lineId, {
    preference: parseOptionalPreference(formData.get("preference")),
    status: parseEnum(
      formData.get("status"),
      PROPOSED_PREMISES_STATUSES,
      "proposed",
    ) as ProposedPremisesStatus,
    tour_date: parseOptionalString(formData.get("tour_date")),
    proposed_price: parseOptionalDecimal(formData.get("proposed_price")),
    proposed_price_psf: parseOptionalDecimal(formData.get("proposed_price_psf")),
    client_comment: parseOptionalString(formData.get("client_comment")),
    advisor_comment: parseOptionalString(formData.get("advisor_comment")),
    remarks: parseOptionalString(formData.get("remarks")),
    collect_fee_amount: parseOptionalDecimal(formData.get("collect_fee_amount")),
    collect_fee_basis: parseOptionalString(formData.get("collect_fee_basis")),
    collect_fee_from_company_id: parseOptionalId(formData.get("collect_fee_from_company_id")),
    collect_fee_status: parseOptionalFeeStatus(formData.get("collect_fee_status")),
    paid_out_fee_amount: parseOptionalDecimal(formData.get("paid_out_fee_amount")),
    paid_out_fee_basis: parseOptionalString(formData.get("paid_out_fee_basis")),
    paid_out_to_company_id: parseOptionalId(formData.get("paid_out_to_company_id")),
    paid_out_status: parseOptionalFeeStatus(formData.get("paid_out_status")),
    fee_remarks: parseOptionalString(formData.get("fee_remarks")),
  });
  revalidateOpportunity(opportunityId);
}

export async function patchProposedPremisesLineInlineAction(
  lineId: number,
  opportunityId: number,
  formData: FormData,
) {
  const line = await getProposedPremisesLine(lineId);
  if (!line) throw new Error("Proposed premises line not found");

  const patch: Parameters<typeof patchProposedPremisesLine>[1] = {};

  if (formData.has("proposed_price")) {
    patch.proposed_price = parseOptionalDecimal(formData.get("proposed_price"));
  }
  if (formData.has("tour_date")) {
    patch.tour_date = parseOptionalString(formData.get("tour_date"));
  }
  if (formData.has("status")) {
    patch.status = parseEnum(
      formData.get("status"),
      PROPOSED_PREMISES_STATUSES,
      line.status,
    ) as ProposedPremisesStatus;
  }
  if (formData.has("preference")) {
    patch.preference = parseOptionalPreference(formData.get("preference"));
  }
  if (formData.has("remarks")) {
    patch.remarks = parseOptionalString(formData.get("remarks"));
  }

  await patchProposedPremisesLine(lineId, patch);
  revalidateOpportunity(opportunityId);
}

async function partyInputFromForm(formData: FormData) {
  const companyId = await normalizeOptionalLegacyCompanyId(formData.get("company_id"));
  if (!companyId) throw new Error("Company is required");
  return {
    company_id: companyId,
    contact_id: await normalizeOptionalLegacyContactId(formData.get("contact_id")),
    role: parseEnum(formData.get("role"), OPPORTUNITY_PARTY_ROLES, "end_user"),
    partnership_mode: parseOptionalString(formData.get("partnership_mode")),
    collect_fee_amount: parseOptionalDecimal(formData.get("collect_fee_amount")),
    collect_fee_percent: parseOptionalDecimal(formData.get("collect_fee_percent")),
    paid_out_fee_amount: parseOptionalDecimal(formData.get("paid_out_fee_amount")),
    paid_out_fee_percent: parseOptionalDecimal(formData.get("paid_out_fee_percent")),
    collect_fee_status: parseOptionalFeeStatus(formData.get("collect_fee_status")) ?? "expected",
    remarks: parseOptionalString(formData.get("remarks")),
  };
}

export async function createOpportunityPartyAction(opportunityId: number, formData: FormData) {
  await createOpportunityParty(opportunityId, await partyInputFromForm(formData));
  revalidateOpportunity(opportunityId);
}

export async function updateOpportunityPartyAction(partyId: number, formData: FormData) {
  const opportunityId = parseOptionalInt(formData.get("opportunity_id"));
  if (!opportunityId) throw new Error("Missing opportunity_id");

  await updateOpportunityParty(partyId, await partyInputFromForm(formData));
  revalidateOpportunity(opportunityId);
}

export async function deleteOpportunityPartyAction(opportunityId: number, partyId: number) {
  await deleteOpportunityParty(partyId);
  revalidateOpportunity(opportunityId);
}

export async function searchPremisesForSelectorAction(formData: FormData) {
  const q = parseOptionalString(formData.get("q")) ?? "";
  const { listPremisesFullFiltered } = await import("@/lib/repos/premisesV1");
  const rows = await listPremisesFullFiltered({ q: q || undefined });
  return rows.slice(0, 50).map((r) => ({
    premises_id: r.premises_id,
    building_name: r.building_name_en ?? r.property_name_en ?? "—",
    floor: r.floor,
    unit: r.unit,
    operator_name: r.operator_name,
    gross_area_sqft: r.gross_area_sqft,
    monthly_rent: r.monthly_rent,
    asking_sale_price: r.asking_sale_price,
    inventory_status: r.inventory_status,
    currency: r.currency,
  }));
}
