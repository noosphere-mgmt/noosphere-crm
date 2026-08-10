import { query } from "@/lib/db";

export type ChannelEntityType = "company" | "contact";

export type ChannelEntity = {
  key: string;
  entity_type: ChannelEntityType;
  id: number;
  business_id: string | null;
  name: string;
};

export type ChannelIntroduction = {
  relationship_id: string;
  from_key: string;
  to_key: string;
};

export type ChannelOpportunity = {
  id: number;
  business_id: string | null;
  client_name: string;
  status: string;
};

export type ChannelOpportunityLink = {
  entity_key: string;
  opportunity: ChannelOpportunity;
};

export type ChannelTreeData = {
  entities: ChannelEntity[];
  introductions: ChannelIntroduction[];
  opportunity_links: ChannelOpportunityLink[];
};

type RelationshipQueryRow = {
  relationship_id: string;
  from_entity_type: ChannelEntityType;
  from_id: string | null;
  from_business_id: string | null;
  from_name: string | null;
  to_entity_type: ChannelEntityType;
  to_id: string | null;
  to_business_id: string | null;
  to_name: string | null;
};

type OpportunityLinkQueryRow = {
  entity_type: ChannelEntityType;
  entity_id: string;
  opportunity_id: string;
  opportunity_business_id: string | null;
  client_name: string;
  status: string;
};

function entityKey(type: ChannelEntityType, id: number): string {
  return `${type}:${id}`;
}

/**
 * Returns the complete referral graph. Relationship references can contain either
 * a legacy numeric id or a business id, so both are resolved before graphing.
 */
export async function getChannelTreeData(): Promise<ChannelTreeData> {
  const [relationshipRows, opportunityRows] = await Promise.all([
    query<RelationshipQueryRow>(
      `SELECT
         r.relationship_id,
         r.from_entity_type,
         CASE WHEN r.from_entity_type = 'company' THEN fc.id::text ELSE fct.id::text END AS from_id,
         CASE WHEN r.from_entity_type = 'company' THEN COALESCE(fc.business_id, fcv.business_id) ELSE COALESCE(fct.business_id, fctv.business_id) END AS from_business_id,
         CASE WHEN r.from_entity_type = 'company' THEN fc.company_name ELSE COALESCE(fct.display_name, fct.contact_name) END AS from_name,
         r.to_entity_type,
         CASE WHEN r.to_entity_type = 'company' THEN tc.id::text ELSE tct.id::text END AS to_id,
         CASE WHEN r.to_entity_type = 'company' THEN COALESCE(tc.business_id, tcv.business_id) ELSE COALESCE(tct.business_id, tctv.business_id) END AS to_business_id,
         CASE WHEN r.to_entity_type = 'company' THEN tc.company_name ELSE COALESCE(tct.display_name, tct.contact_name) END AS to_name
       FROM relationships r
       LEFT JOIN companies fc ON r.from_entity_type = 'company' AND (fc.id::text = r.from_entity_id OR fc.business_id = r.from_entity_id)
       LEFT JOIN companies_v1 fcv ON r.from_entity_type = 'company' AND fcv.legacy_company_id = fc.id
       LEFT JOIN contacts fct ON r.from_entity_type = 'contact' AND (fct.id::text = r.from_entity_id OR fct.business_id = r.from_entity_id)
       LEFT JOIN contacts_v1 fctv ON r.from_entity_type = 'contact' AND fctv.legacy_contact_id = fct.id
       LEFT JOIN companies tc ON r.to_entity_type = 'company' AND (tc.id::text = r.to_entity_id OR tc.business_id = r.to_entity_id)
       LEFT JOIN companies_v1 tcv ON r.to_entity_type = 'company' AND tcv.legacy_company_id = tc.id
       LEFT JOIN contacts tct ON r.to_entity_type = 'contact' AND (tct.id::text = r.to_entity_id OR tct.business_id = r.to_entity_id)
       LEFT JOIN contacts_v1 tctv ON r.to_entity_type = 'contact' AND tctv.legacy_contact_id = tct.id
       WHERE r.relationship_type = 'Refers'
         AND LOWER(r.status) = 'active'
       ORDER BY r.created_at ASC, r.relationship_id ASC`,
    ),
    query<OpportunityLinkQueryRow>(
      `SELECT DISTINCT entity_type, entity_id, opportunity_id, opportunity_business_id, client_name, status
       FROM (
         SELECT 'company'::text AS entity_type, o.company_id::text AS entity_id, o.id::text AS opportunity_id,
                o.business_id AS opportunity_business_id, o.client_name, o.status
         FROM opportunities o WHERE o.company_id IS NOT NULL
         UNION ALL
         SELECT 'company', o.referrer_company_id::text, o.id::text, o.business_id, o.client_name, o.status
         FROM opportunities o WHERE o.referrer_company_id IS NOT NULL
         UNION ALL
         SELECT 'contact', o.primary_contact_id::text, o.id::text, o.business_id, o.client_name, o.status
         FROM opportunities o WHERE o.primary_contact_id IS NOT NULL
         UNION ALL
         SELECT 'contact', o.referrer_contact_id::text, o.id::text, o.business_id, o.client_name, o.status
         FROM opportunities o WHERE o.referrer_contact_id IS NOT NULL
         UNION ALL
         SELECT 'company', op.company_id::text, o.id::text, o.business_id, o.client_name, o.status
         FROM opportunity_parties op JOIN opportunities o ON o.id = op.opportunity_id WHERE op.company_id IS NOT NULL
         UNION ALL
         SELECT 'contact', op.contact_id::text, o.id::text, o.business_id, o.client_name, o.status
         FROM opportunity_parties op JOIN opportunities o ON o.id = op.opportunity_id WHERE op.contact_id IS NOT NULL
       ) linked
       WHERE entity_id IS NOT NULL`,
    ),
  ]);

  const entities = new Map<string, ChannelEntity>();
  const introductions: ChannelIntroduction[] = [];

  for (const row of relationshipRows) {
    const fromId = Number.parseInt(row.from_id ?? "", 10);
    const toId = Number.parseInt(row.to_id ?? "", 10);
    if (!Number.isFinite(fromId) || !Number.isFinite(toId) || !row.from_name || !row.to_name) continue;
    const fromKey = entityKey(row.from_entity_type, fromId);
    const toKey = entityKey(row.to_entity_type, toId);
    entities.set(fromKey, { key: fromKey, entity_type: row.from_entity_type, id: fromId, business_id: row.from_business_id, name: row.from_name });
    entities.set(toKey, { key: toKey, entity_type: row.to_entity_type, id: toId, business_id: row.to_business_id, name: row.to_name });
    introductions.push({ relationship_id: row.relationship_id, from_key: fromKey, to_key: toKey });
  }

  const opportunity_links = opportunityRows.map((row) => ({
    entity_key: entityKey(row.entity_type, Number.parseInt(row.entity_id, 10)),
    opportunity: {
      id: Number.parseInt(row.opportunity_id, 10),
      business_id: row.opportunity_business_id,
      client_name: row.client_name,
      status: row.status,
    },
  }));

  return { entities: [...entities.values()], introductions, opportunity_links };
}
