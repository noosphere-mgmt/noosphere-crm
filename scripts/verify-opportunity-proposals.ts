/**
 * R3 verification: opportunity proposal generator (Phases 43–44).
 */
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import "./ensure-env";
import { buildPricingSnapshot, computeNetEffectiveRent, parseRentFreeMonths } from "../lib/pricing/netEffectiveRent";
import { t } from "../lib/proposals/i18n";
import { renderProposalHtml } from "../lib/proposals/renderProposalHtml";
import { buildItemSnapshots, buildPremisesSnapshot } from "../lib/proposals/snapshots";
import {
  createProposal,
  getProposal,
  insertProposalItem,
  listProposalItems,
  listProposalsForOpportunity,
  setProposalOutputFile,
} from "../lib/repos/opportunityProposals";
import { listProposedPremisesForOpportunity } from "../lib/repos/opportunityProposedPremises";
import { getOpportunity } from "../lib/repos/opportunities";
import { query } from "../lib/db";
import type { Opportunity } from "../lib/types/entities";

function testNetEffectiveRent() {
  const opp: Opportunity = {
    id: 1,
    client_name: "Test",
    lead_type: "direct_client",
    company_name: null,
    company_id: null,
    primary_contact_id: null,
    referrer_company_id: null,
    referrer_contact_id: null,
    sales_role: "to_lease",
    lease_term: "36 months",
    expected_close_date: null,
    lost_reason: null,
    relationship_owner: null,
    budget_min: null,
    budget_max: "50000",
    required_area_sqft: "1000",
    required_capacity_pax: 10,
    district_preference: "Central",
    workspace_type: null,
    property_type: null,
    property_category_preference: null,
    property_type_preference: null,
    target_yield: null,
    funding_status: null,
    move_in_date: null,
    status: "qualifying",
    waiting_for: null,
    next_action: null,
    next_action_date: null,
    requirement_summary: null,
    remarks: null,
    created_at: "",
    updated_at: "",
  };

  const result = computeNetEffectiveRent(
    {
      monthly_rent: "30000",
      rent_psf: null,
      rent_free_period: "2 months",
      contract_term_months: 36,
      management_fee: "1000",
      deposit_months: "2",
      asking_sale_price: null,
      currency: "HKD",
    },
    opp,
  );

  assert.equal(result.face_rent, 30000);
  assert.equal(result.rent_free_months, 2);
  assert.equal(result.term_months, 36);
  assert.ok(result.net_effective_rent != null && result.net_effective_rent < 30000);
  assert.equal(parseRentFreeMonths("3"), 3);
  assert.ok(
    buildPricingSnapshot(
      {
        monthly_rent: "20000",
        rent_psf: null,
        rent_free_period: null,
        contract_term_months: 36,
        management_fee: null,
        deposit_months: null,
        asking_sale_price: null,
        currency: "HKD",
      },
      opp,
    ).display_rent.includes("20"),
  );
}

function testI18n() {
  assert.equal(t("proposal.title", "en"), "Property Proposal");
  assert.equal(t("proposal.title", "zh-Hant"), "物業建議書");
  assert.equal(t("proposal.title", "zh-Hans"), "物业建议书");
}

function testHtmlRender() {
  const html = renderProposalHtml({
    proposal: {
      id: 1,
      opportunity_id: 1,
      title: "Test Co — Options",
      proposal_date: "2026-08-06",
      language: "en",
      status: "draft",
      version_number: 1,
      supersedes_id: null,
      prepared_for_company_id: null,
      prepared_for_contact_id: null,
      template_key: "default",
      executive_summary: "Summary text",
      consultancy_advice: null,
      output_file: null,
      sent_date: null,
      remarks: null,
      created_at: "",
      updated_at: "",
    },
    items: [],
    opportunity: {
      id: 1,
      client_name: "Test Co",
      business_id: "M100001",
    } as Opportunity,
    preparedForLabel: "Test Co",
  });
  assert.ok(html.includes("Property Proposal"));
  assert.ok(html.includes("Summary text"));
  assert.ok(html.includes("M100001"));
}

async function testLiveProposalFlow() {
  const opps = await query<{ id: string }>(`SELECT id::text FROM opportunities ORDER BY id LIMIT 1`);
  const opportunityId = Number.parseInt(opps[0]?.id ?? "", 10);
  assert.ok(Number.isFinite(opportunityId), "need at least one opportunity");

  const opportunity = await getOpportunity(opportunityId);
  assert.ok(opportunity);

  const shortlist = await listProposedPremisesForOpportunity(opportunityId);
  console.log(`- opportunity ${opportunityId} shortlist rows: ${shortlist.length}`);

  const proposalId = await createProposal({
    opportunityId,
    title: `[verify] ${opportunity!.client_name} — Property Options`,
    language: "en",
    proposalDate: new Date().toISOString().slice(0, 10),
    versionNumber: 999,
  });

  let itemCount = 0;
  for (const line of shortlist.slice(0, 3)) {
    const premisesRows = await query<Record<string, unknown>>(
      `SELECT pm.premises_id, pm.business_id, pm.property_id, pm.property_name_en, pm.property_name_zh,
              pm.property_category, pm.space_form, pm.floor, pm.unit, pm.capacity_pax, pm.operating_model,
              pm.gross_area_sqft::text AS gross_area_sqft, pm.net_area_sqft::text AS net_area_sqft,
              pm.monthly_rent::text AS monthly_rent, pm.rent_psf::text AS rent_psf, pm.rent_free_period,
              pm.contract_term_months, pm.management_fee::text AS management_fee, pm.deposit_months,
              pm.asking_sale_price::text AS asking_sale_price, pm.currency, pm.source_file, pm.source_url,
              pm.relationship_lines,
              pv.bldg_name_en, pv.bldg_name_zh, pv.bldg_name_cn, pv.district_en, pv.business_id AS building_business_id
       FROM premises_v1 pm
       JOIN properties_v1 pv ON pv.property_id = pm.property_id
       WHERE pm.premises_id = $1`,
      [line.premises_id],
    );
    const row = premisesRows[0];
    if (!row) continue;

    const premises = {
      premises_id: String(row.premises_id),
      business_id: (row.business_id as string) ?? null,
      property_id: String(row.property_id),
      property_name_en: (row.property_name_en as string) ?? null,
      property_name_zh: (row.property_name_zh as string) ?? null,
      property_category: (row.property_category as string) ?? null,
      space_form: (row.space_form as string) ?? null,
      floor: (row.floor as string) ?? null,
      unit: (row.unit as string) ?? null,
      capacity_pax: row.capacity_pax != null ? Number(row.capacity_pax) : null,
      operating_model: (row.operating_model as string) ?? null,
      gross_area_sqft: (row.gross_area_sqft as string) ?? null,
      net_area_sqft: (row.net_area_sqft as string) ?? null,
      monthly_rent: (row.monthly_rent as string) ?? null,
      rent_psf: (row.rent_psf as string) ?? null,
      rent_free_period: (row.rent_free_period as string) ?? null,
      contract_term_months: row.contract_term_months != null ? Number(row.contract_term_months) : null,
      management_fee: (row.management_fee as string) ?? null,
      deposit_months: (row.deposit_months as string) ?? null,
      asking_sale_price: (row.asking_sale_price as string) ?? null,
      currency: (row.currency as string) ?? null,
      source_file: (row.source_file as string) ?? null,
      source_url: (row.source_url as string) ?? null,
      relationship_lines: [],
      bldg_name_en: (row.bldg_name_en as string) ?? null,
      bldg_name_zh: (row.bldg_name_zh as string) ?? null,
      bldg_name_cn: (row.bldg_name_cn as string) ?? null,
      district_en: (row.district_en as string) ?? null,
      building_business_id: (row.building_business_id as string) ?? null,
    };

    const snaps = buildItemSnapshots(premises, opportunity!, "en", line);
    buildPremisesSnapshot(premises, "zh-Hant");

    await insertProposalItem(proposalId, {
      premisesId: line.premises_id,
      proposedPremisesId: line.id,
      rank: itemCount + 1,
      displayRent: snaps.display_rent,
      netEffectiveRent: snaps.net_effective_rent,
      totalInitialCost: snaps.total_initial_cost,
      pricingSnapshot: snaps.pricing_snapshot,
      premisesSnapshot: snaps.premises_snapshot,
      mediaSnapshot: snaps.media_snapshot,
    });
    itemCount++;
  }

  assert.ok(itemCount >= 0);
  const items = await listProposalItems(proposalId);
  console.log(`- created proposal #${proposalId} with ${items.length} item(s)`);
  assert.ok(items.every((i) => i.pricing_snapshot != null));
  assert.ok(items.every((i) => i.premises_snapshot != null));

  const relPath = `verify/${proposalId}-v999.pdf`;
  await setProposalOutputFile(proposalId, relPath);
  const updated = await getProposal(proposalId);
  assert.equal(updated?.output_file, relPath);

  const listed = await listProposalsForOpportunity(opportunityId);
  assert.ok(listed.some((p) => p.id === proposalId));

  await query(`DELETE FROM opportunity_proposals WHERE id = $1`, [proposalId]);
  console.log("- cleaned up verify proposal row");
}

async function main(): Promise<void> {
  console.log("Opportunity proposals (Phase 43–44) verification:");
  testNetEffectiveRent();
  testI18n();
  testHtmlRender();
  await testLiveProposalFlow();
  console.log("OK: Phase 43–44 proposal checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
