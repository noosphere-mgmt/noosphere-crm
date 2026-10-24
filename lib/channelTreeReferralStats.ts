import type { ChannelEntityType, ChannelIntroduction, ChannelOpportunity, ChannelOpportunityLink } from "@/lib/repos/channelTree";

export const CHANNEL_REFERRAL_PARTY_ROLES = ["referring_agent", "referrer"] as const;

export type ChannelReferralQueryRow = {
  row_type: string;
  entity_type: ChannelEntityType;
  entity_id: string;
  contact_id: string | null;
  opportunity_id: string | null;
  opportunity_business_id: string | null;
  client_name: string | null;
  status: string | null;
  start_date: string | null;
};

function entityKey(type: ChannelEntityType, id: number): string {
  return `${type}:${id}`;
}

export function buildChannelIntroductionChildren(introductions: ChannelIntroduction[]): Map<string, string[]> {
  const children = new Map<string, string[]>();
  for (const edge of introductions) {
    children.set(edge.from_key, [...(children.get(edge.from_key) ?? []), edge.to_key]);
  }
  return children;
}

export function countChannelIntroductions(
  key: string,
  children: Map<string, string[]>,
  visited = new Set<string>(),
): number {
  if (visited.has(key)) return 0;
  const nextVisited = new Set(visited).add(key);
  const referred = children.get(key) ?? [];
  return referred.length + referred.reduce((sum, childKey) => sum + countChannelIntroductions(childKey, children, nextVisited), 0);
}

export function collectChannelBranchOpportunities(
  key: string,
  opportunitiesByEntity: Map<string, ChannelOpportunity[]>,
  directChildren: (entityKey: string) => string[],
  visited = new Set<string>(),
): Map<number, ChannelOpportunity> {
  if (visited.has(key)) return new Map();
  const nextVisited = new Set(visited).add(key);
  const result = new Map((opportunitiesByEntity.get(key) ?? []).map((opportunity) => [opportunity.id, opportunity]));
  for (const childKey of directChildren(key)) {
    for (const [id, opportunity] of collectChannelBranchOpportunities(childKey, opportunitiesByEntity, directChildren, nextVisited)) {
      result.set(id, opportunity);
    }
  }
  return result;
}

export function channelOpportunityCounts(opportunities: ChannelOpportunity[]) {
  return {
    opportunities: opportunities.length,
    active: opportunities.filter((opportunity) => opportunity.status !== "closed_won" && opportunity.status !== "closed_lost").length,
    won: opportunities.filter((opportunity) => opportunity.status === "closed_won").length,
  };
}

/** Keep each opportunity once per contact/company while retaining contact-level attribution. */
export function buildChannelReferralLinks(rows: ChannelReferralQueryRow[]): ChannelOpportunityLink[] {
  const companiesByContact = new Map<number, Set<number>>();
  for (const row of rows) {
    if (row.row_type !== "membership" || row.contact_id == null || row.entity_type !== "company") continue;
    const contactId = Number.parseInt(row.contact_id, 10);
    const companyId = Number.parseInt(row.entity_id, 10);
    if (!Number.isFinite(contactId) || !Number.isFinite(companyId)) continue;
    const companyIds = companiesByContact.get(contactId) ?? new Set<number>();
    companyIds.add(companyId);
    companiesByContact.set(contactId, companyIds);
  }

  const links = new Map<string, ChannelOpportunityLink>();
  function addLink(type: ChannelEntityType, entityId: number, opportunity: ChannelOpportunity): void {
    const key = entityKey(type, entityId);
    links.set(`${key}:${opportunity.id}`, { entity_key: key, opportunity });
  }

  for (const row of rows) {
    if (row.row_type !== "referral" || row.opportunity_id == null) continue;
    const entityId = Number.parseInt(row.entity_id, 10);
    const opportunityId = Number.parseInt(row.opportunity_id, 10);
    if (
      !Number.isFinite(entityId) ||
      !Number.isFinite(opportunityId) ||
      row.client_name == null ||
      row.status == null
    ) continue;

    const opportunity: ChannelOpportunity = {
      id: opportunityId,
      business_id: row.opportunity_business_id,
      client_name: row.client_name,
      status: row.status,
      start_date: row.start_date,
    };
    addLink(row.entity_type, entityId, opportunity);

    if (row.contact_id == null || row.entity_type !== "contact") continue;
    const contactId = Number.parseInt(row.contact_id, 10);
    if (!Number.isFinite(contactId)) continue;
    for (const companyId of companiesByContact.get(contactId) ?? []) {
      addLink("company", companyId, opportunity);
    }
  }

  return [...links.values()];
}

export type IndexedChannelReferrals = Map<string, Map<number, ChannelOpportunity>>;

export function indexChannelReferralLinks(links: ChannelOpportunityLink[]): IndexedChannelReferrals {
  const indexed: IndexedChannelReferrals = new Map();
  for (const link of links) {
    const opportunities = indexed.get(link.entity_key) ?? new Map<number, ChannelOpportunity>();
    opportunities.set(link.opportunity.id, link.opportunity);
    indexed.set(link.entity_key, opportunities);
  }
  return indexed;
}

/** Aggregate referrals over introduction descendants, counting each opportunity once per displayed branch. */
export function collectChannelBranchReferrals(
  key: string,
  referralsByEntity: IndexedChannelReferrals,
  childrenByEntity: Map<string, string[]>,
  visited = new Set<string>(),
): Map<number, ChannelOpportunity> {
  if (visited.has(key)) return new Map();
  const nextVisited = new Set(visited).add(key);
  const result = new Map(referralsByEntity.get(key) ?? []);
  for (const childKey of childrenByEntity.get(key) ?? []) {
    for (const [id, opportunity] of collectChannelBranchReferrals(childKey, referralsByEntity, childrenByEntity, nextVisited)) {
      result.set(id, opportunity);
    }
  }
  return result;
}
