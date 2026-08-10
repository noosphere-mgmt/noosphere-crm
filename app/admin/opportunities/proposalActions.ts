"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { mapContactLanguageToProposal } from "@/lib/proposals/i18n";
import { isProposalsEnabled } from "@/lib/proposals/proposalEngine";
import { renderProposalPdf } from "@/lib/proposals/renderProposalPdf";
import {
  buildItemSnapshots,
  buildMediaSnapshot,
  PROMOTABLE_SHORTLIST_STATUSES,
} from "@/lib/proposals/snapshots";
import { removeProposalPdf, saveProposalPdf } from "@/lib/proposalStorage";
import { getContact } from "@/lib/repos/contacts";
import { getOpportunity } from "@/lib/repos/opportunities";
import {
  assertProposalDraft,
  createProposal,
  deleteProposal,
  getLatestProposalVersionNumber,
  getPremisesWithBuilding,
  getProposal,
  insertProposalItem,
  listProposalItems,
  listProposalsForOpportunity,
  markProposalSent,
  markProposalSuperseded,
  refreshItemSnapshots,
  setProposalOutputFile,
  shortlistLinePassesCategoryGuard,
  updateProposal,
  updateProposalItem,
} from "@/lib/repos/opportunityProposals";
import { listProposedPremisesForOpportunity } from "@/lib/repos/opportunityProposedPremises";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import type { ProposalLanguage } from "@/lib/types/entities";

function assertEnabled() {
  if (!isProposalsEnabled()) throw new Error("Proposals are not enabled");
}

function revalidateOpportunity(opportunityId: number, businessId?: string | null) {
  try {
    revalidatePath("/admin/opportunities");
    revalidatePath(`/admin/opportunities/${opportunityId}`);
    if (businessId) revalidatePath(`/admin/opportunities/${businessId}`);
  } catch {
    // no-op outside Next.js request context (verify scripts)
  }
}

function parseLineIds(raw: string | null | undefined): number[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;]/)
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function defaultProposalTitle(clientName: string): string {
  return `${clientName.trim() || "Client"} — Property Options`;
}

export async function listOpportunityProposalsAction(opportunityId: number) {
  assertEnabled();
  return listProposalsForOpportunity(opportunityId);
}

export async function getProposalDetailAction(proposalId: number) {
  assertEnabled();
  const proposal = await getProposal(proposalId);
  if (!proposal) return null;
  const items = await listProposalItems(proposalId);
  return { proposal, items };
}

export async function deleteGeneratedProposalDocumentAction(proposalId: number) {
  assertEnabled();
  const proposal = await getProposal(proposalId);
  if (!proposal) return;
  await deleteProposal(proposalId);
  await removeProposalPdf(proposal.output_file);
  const opportunity = await getOpportunity(proposal.opportunity_id);
  revalidateOpportunity(proposal.opportunity_id, opportunity?.business_id);
}

export async function createProposalFromShortlistAction(
  opportunityId: number,
  formData: FormData,
): Promise<{ proposalId: number }> {
  assertEnabled();
  const opportunity = await getOpportunity(opportunityId);
  if (!opportunity) throw new Error("Opportunity not found");

  const lineIds = parseLineIds(String(formData.get("line_ids") ?? ""));
  const allLines = await listProposedPremisesForOpportunity(opportunityId);
  let eligible = allLines.filter((line) => PROMOTABLE_SHORTLIST_STATUSES.has(line.status));

  if (lineIds.length > 0) {
    const idSet = new Set(lineIds);
    eligible = eligible.filter((line) => idSet.has(line.id));
  }

  const filtered: typeof eligible = [];
  for (const line of eligible) {
    const premises = await getPremisesWithBuilding(line.premises_id);
    if (
      premises &&
      shortlistLinePassesCategoryGuard(
        premises,
        opportunity.property_category_preference,
        opportunity.property_type_preference,
      )
    ) {
      filtered.push(line);
    }
  }

  if (filtered.length === 0) throw new Error("No eligible shortlist rows to include");

  let language: ProposalLanguage = "en";
  if (opportunity.primary_contact_id) {
    const contact = await getContact(opportunity.primary_contact_id);
    language = mapContactLanguageToProposal(contact?.preferred_language);
  }

  const proposalId = await createProposal({
    opportunityId,
    title: defaultProposalTitle(opportunity.client_name),
    language,
    proposalDate: new Date().toISOString().slice(0, 10),
    preparedForCompanyId: opportunity.company_id,
    preparedForContactId: opportunity.primary_contact_id,
    versionNumber: (await getLatestProposalVersionNumber(opportunityId)) + 1 || 1,
  });

  let rank = 1;
  for (const line of filtered) {
    const premises = await getPremisesWithBuilding(line.premises_id);
    if (!premises) continue;
    const media = await buildMediaSnapshot(premises);
    const snaps = buildItemSnapshots(premises, opportunity, language, line, media);
    await insertProposalItem(proposalId, {
      premisesId: line.premises_id,
      proposedPremisesId: line.id,
      rank: rank++,
      recommended: line.preference === "high",
      displayRent: snaps.display_rent,
      netEffectiveRent: snaps.net_effective_rent,
      totalInitialCost: snaps.total_initial_cost,
      advisorComment: line.advisor_comment,
      pricingSnapshot: snaps.pricing_snapshot,
      premisesSnapshot: snaps.premises_snapshot,
      mediaSnapshot: snaps.media_snapshot,
    });
  }

  revalidateOpportunity(opportunityId, opportunity.business_id);
  return { proposalId };
}

export async function createEmptyProposalAction(opportunityId: number) {
  assertEnabled();
  const opportunity = await getOpportunity(opportunityId);
  if (!opportunity) throw new Error("Opportunity not found");

  const proposalId = await createProposal({
    opportunityId,
    title: defaultProposalTitle(opportunity.client_name),
    proposalDate: new Date().toISOString().slice(0, 10),
    preparedForCompanyId: opportunity.company_id,
    preparedForContactId: opportunity.primary_contact_id,
    versionNumber: (await getLatestProposalVersionNumber(opportunityId)) + 1 || 1,
  });

  revalidateOpportunity(opportunityId, opportunity.business_id);
  return { proposalId };
}

export async function updateProposalAction(proposalId: number, formData: FormData) {
  assertEnabled();
  const proposal = await assertProposalDraft(proposalId);
  await updateProposal(proposalId, {
    title: String(formData.get("title") ?? proposal.title),
    proposalDate: String(formData.get("proposal_date") ?? "").trim() || null,
    language: (String(formData.get("language") ?? proposal.language) as ProposalLanguage) || "en",
    executiveSummary: String(formData.get("executive_summary") ?? ""),
    consultancyAdvice: String(formData.get("consultancy_advice") ?? ""),
    remarks: String(formData.get("remarks") ?? ""),
  });
  const opp = await getOpportunity(proposal.opportunity_id);
  revalidateOpportunity(proposal.opportunity_id, opp?.business_id);
}

export async function updateProposalItemAction(itemId: number, formData: FormData) {
  assertEnabled();
  const proposalId = Number.parseInt(String(formData.get("proposal_id") ?? ""), 10);
  if (!Number.isFinite(proposalId)) throw new Error("Missing proposal_id");
  await assertProposalDraft(proposalId);

  const recommended = formData.get("recommended") === "on" || formData.get("recommended") === "true";
  const nerRaw = String(formData.get("net_effective_rent") ?? "").trim();
  const ner = nerRaw ? Number.parseFloat(nerRaw) : null;

  await updateProposalItem(itemId, {
    rank: Number.parseInt(String(formData.get("rank") ?? ""), 10) || null,
    recommended,
    displayRent: String(formData.get("display_rent") ?? ""),
    netEffectiveRent: Number.isFinite(ner!) ? ner : null,
    pros: String(formData.get("pros") ?? ""),
    cons: String(formData.get("cons") ?? ""),
    advisorComment: String(formData.get("advisor_comment") ?? ""),
  });

  const proposal = await getProposal(proposalId);
  const opp = proposal ? await getOpportunity(proposal.opportunity_id) : null;
  if (proposal) revalidateOpportunity(proposal.opportunity_id, opp?.business_id);
}

export async function recalculateProposalPricingAction(proposalId: number) {
  assertEnabled();
  const proposal = await assertProposalDraft(proposalId);
  const opportunity = await getOpportunity(proposal.opportunity_id);
  if (!opportunity) throw new Error("Opportunity not found");

  const items = await listProposalItems(proposalId);
  for (const item of items) {
    const premises = await getPremisesWithBuilding(item.premises_id);
    if (!premises) continue;
    const media = await buildMediaSnapshot(premises);
    const snaps = buildItemSnapshots(premises, opportunity, proposal.language, null, media);
    await refreshItemSnapshots(item.id, {
      pricingSnapshot: snaps.pricing_snapshot,
      premisesSnapshot: snaps.premises_snapshot,
      mediaSnapshot: snaps.media_snapshot,
      displayRent: snaps.display_rent,
      netEffectiveRent: snaps.net_effective_rent,
      totalInitialCost: snaps.total_initial_cost,
    });
  }

  revalidateOpportunity(proposal.opportunity_id, opportunity.business_id);
}

export async function generateProposalPdfAction(proposalId: number): Promise<{ outputFile: string }> {
  assertEnabled();
  const proposal = await getProposal(proposalId);
  if (!proposal) throw new Error("Proposal not found");
  const opportunity = await getOpportunity(proposal.opportunity_id);
  if (!opportunity) throw new Error("Opportunity not found");
  const items = await listProposalItems(proposalId);

  const preparedForLabel =
    proposal.prepared_for_contact_name ??
    proposal.prepared_for_company_name ??
    opportunity.client_name;

  const pdf = await renderProposalPdf({
    proposal,
    items,
    opportunity,
    preparedForLabel,
  });

  const relative = await saveProposalPdf(
    proposal.opportunity_id,
    proposal.id,
    proposal.version_number,
    pdf,
  );
  await setProposalOutputFile(proposalId, relative);
  revalidateOpportunity(proposal.opportunity_id, opportunity.business_id);
  return { outputFile: relative };
}

export async function markProposalSentAction(proposalId: number, formData: FormData) {
  assertEnabled();
  const proposal = await getProposal(proposalId);
  if (!proposal) throw new Error("Proposal not found");
  if (proposal.status !== "draft") throw new Error("Only draft proposals can be marked sent");

  const sentDate = String(formData.get("sent_date") ?? "").trim() || new Date().toISOString().slice(0, 10);
  await markProposalSent(proposalId, sentDate);

  if (formData.get("update_opportunity_status") === "on") {
    await query(
      `UPDATE opportunities SET status = 'proposal_reviewing' WHERE id = $1`,
      [proposal.opportunity_id],
    );
  }

  const opp = await getOpportunity(proposal.opportunity_id);
  revalidateOpportunity(proposal.opportunity_id, opp?.business_id);
}

export async function createProposalRevisionAction(proposalId: number) {
  assertEnabled();
  const source = await getProposal(proposalId);
  if (!source) throw new Error("Proposal not found");
  const opportunity = await getOpportunity(source.opportunity_id);
  if (!opportunity) throw new Error("Opportunity not found");

  const newId = await createProposal({
    opportunityId: source.opportunity_id,
    title: source.title,
    language: source.language,
    proposalDate: new Date().toISOString().slice(0, 10),
    preparedForCompanyId: source.prepared_for_company_id,
    preparedForContactId: source.prepared_for_contact_id,
    executiveSummary: source.executive_summary,
    consultancyAdvice: source.consultancy_advice,
    versionNumber: source.version_number + 1,
    supersedesId: source.id,
  });

  const items = await listProposalItems(proposalId);
  for (const item of items) {
    await insertProposalItem(newId, {
      premisesId: item.premises_id,
      proposedPremisesId: item.proposed_premises_id,
      rank: item.rank ?? 0,
      recommended: item.recommended,
      displayRent: item.display_rent,
      netEffectiveRent: item.net_effective_rent ? Number.parseFloat(item.net_effective_rent) : null,
      totalInitialCost: item.total_initial_cost ? Number.parseFloat(item.total_initial_cost) : null,
      advisorComment: item.advisor_comment,
      pricingSnapshot: item.pricing_snapshot,
      premisesSnapshot: item.premises_snapshot,
      mediaSnapshot: item.media_snapshot,
    });
  }

  if (source.status === "sent" || source.status === "accepted") {
    await markProposalSuperseded(source.id);
  }

  revalidateOpportunity(source.opportunity_id, opportunity.business_id);
  return { proposalId: newId };
}

export async function createProposalFromShortlistAndRedirectAction(
  opportunityId: number,
  formData: FormData,
) {
  const { proposalId } = await createProposalFromShortlistAction(opportunityId, formData);
  const opp = await getOpportunity(opportunityId);
  const href = opportunityWorkspaceHref(
    { id: opportunityId, business_id: opp?.business_id },
    "documents",
  );
  redirect(`${href}${href.includes("?") ? "&" : "?"}proposal=${proposalId}`);
}

export async function createEmptyProposalAndRedirectAction(opportunityId: number) {
  const { proposalId } = await createEmptyProposalAction(opportunityId);
  const opp = await getOpportunity(opportunityId);
  const href = opportunityWorkspaceHref(
    { id: opportunityId, business_id: opp?.business_id },
    "documents",
  );
  redirect(`${href}${href.includes("?") ? "&" : "?"}proposal=${proposalId}`);
}
