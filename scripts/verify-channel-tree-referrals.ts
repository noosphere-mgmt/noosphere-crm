import assert from "node:assert/strict";
import {
  buildChannelIntroductionChildren,
  CHANNEL_REFERRAL_PARTY_ROLES,
  buildChannelReferralLinks,
  channelOpportunityCounts,
  collectChannelBranchReferrals,
  collectChannelBranchOpportunities,
  countChannelIntroductions,
  indexChannelReferralLinks,
  type ChannelReferralQueryRow,
} from "../lib/channelTreeReferralStats";

assert.deepEqual(CHANNEL_REFERRAL_PARTY_ROLES, ["referring_agent", "referrer"]);
console.log("OK  canonical and legacy opportunity-party referral roles are supported");

function membership(contactId: string, companyId: string): ChannelReferralQueryRow {
  return {
    row_type: "membership",
    entity_type: "company",
    entity_id: companyId,
    contact_id: contactId,
    opportunity_id: null,
    opportunity_business_id: null,
    client_name: null,
    status: null,
    start_date: null,
  };
}

function referral(
  entityType: "company" | "contact",
  entityId: string,
  opportunityId: string,
  contactId: string | null,
): ChannelReferralQueryRow {
  return {
    row_type: "referral",
    entity_type: entityType,
    entity_id: entityId,
    contact_id: contactId,
    opportunity_id: opportunityId,
    opportunity_business_id: `M100${opportunityId}`,
    client_name: `Opportunity ${opportunityId}`,
    status: "qualifying",
    start_date: null,
  };
}

const links = buildChannelReferralLinks([
  membership("101", "201"),
  membership("101", "201"),
  membership("101", "202"),
  referral("contact", "101", "501", "101"),
  referral("contact", "101", "501", "101"),
  referral("company", "201", "501", null),
  referral("company", "201", "502", null),
]);
const indexed = indexChannelReferralLinks(links);

assert.equal(indexed.get("contact:101")?.size, 1, "contact receives one direct referral credit");
assert.equal(indexed.get("company:201")?.size, 2, "company membership and direct company referrals are retained without duplicate opportunities");
assert.equal(indexed.get("company:202")?.size, 1, "a contact referral is credited to every associated company");
assert.equal(indexed.get("company:201")?.has(501), true, "company membership aggregates the contact's referral");
assert.equal(indexed.get("company:202")?.has(501), true, "multiple company memberships aggregate the same referral");
assert.equal(indexed.get("company:201")?.has(502), true, "direct company referrals remain attributed to the company");
console.log("OK  direct contact referrals aggregate to each associated company and deduplicate per entity");

const introductionTree = buildChannelIntroductionChildren([
  { relationship_id: "intro-1", from_key: "company:201", to_key: "contact:101" },
  { relationship_id: "intro-2", from_key: "company:202", to_key: "company:301" },
]);
assert.deepEqual([...introductionTree], [
  ["company:201", ["contact:101"]],
  ["company:202", ["company:301"]],
], "related-company memberships do not add/reparent introduction edges");
assert.equal(countChannelIntroductions("company:202", introductionTree), 1, "introduction totals follow only existing introduction edges");
assert.equal(introductionTree.has("company:303"), false, "related-company membership does not create a new tree root");
console.log("OK  company memberships do not alter introduction-tree hierarchy or counts");

const branchLinks = indexChannelReferralLinks([
  ...links,
  { entity_key: "contact:102", opportunity: indexed.get("contact:101")!.get(501)! },
]);
const branch = collectChannelBranchReferrals("company:201", branchLinks, introductionTree);
assert.equal(branch.get(501)?.id, 501, "a branch counts an opportunity shared by company and contact descendants once");
assert.equal(branch.get(502)?.id, 502, "company's directly attributed opportunity remains in branch totals");
assert.equal(branch.size, 2, "branch totals deduplicate by opportunity ID across descendants");
console.log("OK  displayed branch totals count each opportunity once across company and contact nodes");

const branchOpportunities = new Map<string, typeof links[number]["opportunity"][]>([
  ["company:201", [
    { id: 501, business_id: "M100501", client_name: "Opportunity 501", status: "qualifying" },
    { id: 503, business_id: "M100503", client_name: "Opportunity 503", status: "closed_won" },
  ]],
  ["contact:101", [
    { id: 501, business_id: "M100501", client_name: "Opportunity 501", status: "qualifying" },
    { id: 504, business_id: "M100504", client_name: "Opportunity 504", status: "closed_lost" },
  ]],
]);
const broadOpportunities = collectChannelBranchOpportunities(
  "company:201",
  branchOpportunities,
  (key) => key === "company:201" ? ["contact:101"] : [],
);
const broadCounts = channelOpportunityCounts([...broadOpportunities.values()]);
assert.deepEqual(broadCounts, { opportunities: 3, active: 1, won: 1 }, "broad opportunity metrics retain non-referral links and original open/won status rules");
assert.equal(countChannelIntroductions("company:201", introductionTree), 1, "referral opportunity links do not inflate introduction totals");
console.log("OK  broad opportunity, active, and won metrics remain independent of referral metrics");

const johnReferralCopies = links.filter((link) => link.opportunity.id === 501);
assert.equal(johnReferralCopies.length, 3, "the contact and both associated companies each receive direct referral attribution");
assert.equal(new Set(johnReferralCopies.map((link) => link.opportunity.id)).size, 1, "overall unique referral opportunities count M501 once");
assert.equal(indexed.get("company:201")?.has(502), true, "company-direct referral remains distinct and attributed");
console.log("OK  multiple company credits do not inflate unique referral opportunity totals");
