import { query } from "@/lib/db";
import { OPEN_OPPORTUNITY_STATUS_SQL } from "@/lib/openOpportunityStatus";

export type DashboardPipelineKpis = {
  open_count: number;
  proposal_sent_count: number;
  viewing_count: number;
  negotiation_count: number;
  won_this_month_count: number;
  expected_fee_pipeline: number;
};

export type DashboardAttentionRow = {
  opportunity_id: number;
  opportunity_name: string;
  company_name: string | null;
  status: string;
  last_activity_date: string | null;
  last_activity_type: string | null;
  days_since_activity: number | null;
  expected_fee: number;
};

export type DashboardUpcomingActivity = {
  activity_id: string;
  activity_date: string;
  activity_type: string;
  company_name: string | null;
  contact_name: string | null;
  opportunity_id: number | null;
  opportunity_name: string | null;
  premises_label: string | null;
};

export type DashboardRevenueRow = {
  bucket: string;
  label: string;
  opp_count: number;
  expected_fee: number;
  confirmed_fee: number;
};

export type DashboardPartyPerformanceRow = {
  company_id: number;
  contact_id: number | null;
  party_name: string;
  active_opps: number;
  won_opps: number;
  expected_fee: number;
  collected_fee: number;
};

export type DashboardProposedPremisesRow = {
  premises_id: string;
  premises_label: string;
  operator_name: string | null;
  proposal_count: number;
  viewing_count: number;
  won_count: number;
};

export type DashboardOperatorRow = {
  operator_company_id: string | null;
  operator_name: string;
  proposed_count: number;
  viewed_count: number;
  won_count: number;
  win_rate: number | null;
};

export type DashboardRelationshipNode = {
  contact_id: number;
  contact_name: string;
  introduced_companies: number;
  introduced_contacts: number;
  active_opportunities: number;
  won_opportunities: number;
  companies: Array<{
    company_id: number;
    company_name: string;
    active_opportunities: number;
    won_opportunities: number;
  }>;
};

export type DashboardData = {
  pipeline: DashboardPipelineKpis;
  attention: DashboardAttentionRow[];
  upcoming_activities: DashboardUpcomingActivity[];
  revenue_pipeline: DashboardRevenueRow[];
  revenue_totals: { opp_count: number; expected_fee: number; confirmed_fee: number };
  top_referrers: DashboardPartyPerformanceRow[];
  top_agents: DashboardPartyPerformanceRow[];
  top_proposed_premises: DashboardProposedPremisesRow[];
  operator_performance: DashboardOperatorRow[];
  relationship_network: DashboardRelationshipNode[];
};

const OPEN_STATUS_SQL = OPEN_OPPORTUNITY_STATUS_SQL;

/** Max rows returned per dashboard table — keeps page load fast at scale. */
export const DASHBOARD_TABLE_LIMIT = 10;

function num(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number.parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

async function fetchPipelineKpis(): Promise<DashboardPipelineKpis> {
  const rows = await query<Record<string, unknown>>(
    `WITH opp_fees AS (
       SELECT opportunity_id,
         COALESCE(SUM(collect_fee_amount), 0) - COALESCE(SUM(paid_out_fee_amount), 0) AS net_fee
       FROM opportunity_proposed_premises
       GROUP BY opportunity_id
     ),
     viewing_opps AS (
       SELECT DISTINCT opportunity_id
       FROM opportunity_proposed_premises
       WHERE status = 'viewing'
     )
     SELECT
       COUNT(*) FILTER (WHERE o.status NOT IN ${OPEN_STATUS_SQL})::text AS open_count,
       COUNT(*) FILTER (WHERE o.status IN ('proposal_sent', 'proposal_preparing'))::text AS proposal_sent_count,
       (SELECT COUNT(*)::text FROM viewing_opps vo
         JOIN opportunities ox ON ox.id = vo.opportunity_id
         WHERE ox.status NOT IN ${OPEN_STATUS_SQL}) AS viewing_count,
       COUNT(*) FILTER (WHERE o.status = 'negotiating')::text AS negotiation_count,
       COUNT(*) FILTER (
         WHERE o.status = 'closed_won'
           AND date_trunc('month', o.updated_at) = date_trunc('month', CURRENT_DATE)
       )::text AS won_this_month_count,
       COALESCE(SUM(of.net_fee) FILTER (WHERE o.status NOT IN ${OPEN_STATUS_SQL}), 0)::text AS expected_fee_pipeline
     FROM opportunities o
     LEFT JOIN opp_fees of ON of.opportunity_id = o.id`,
  );
  const r = rows[0] ?? {};
  return {
    open_count: num(r.open_count),
    proposal_sent_count: num(r.proposal_sent_count),
    viewing_count: num(r.viewing_count),
    negotiation_count: num(r.negotiation_count),
    won_this_month_count: num(r.won_this_month_count),
    expected_fee_pipeline: num(r.expected_fee_pipeline),
  };
}

async function fetchAttentionRequired(): Promise<DashboardAttentionRow[]> {
  const rows = await query<Record<string, unknown>>(
    `WITH last_activity AS (
       SELECT a.opportunity_id,
         MAX(a.activity_date) AS last_date,
         (ARRAY_AGG(a.activity_type ORDER BY a.activity_date DESC, a.id DESC))[1] AS last_type
       FROM activities a
       WHERE a.opportunity_id IS NOT NULL
       GROUP BY a.opportunity_id
     ),
     opp_fees AS (
       SELECT opportunity_id,
         COALESCE(SUM(collect_fee_amount), 0) - COALESCE(SUM(paid_out_fee_amount), 0) AS net_fee
       FROM opportunity_proposed_premises
       GROUP BY opportunity_id
     )
     SELECT
       o.id::text AS opportunity_id,
       o.client_name AS opportunity_name,
       lc.company_name,
       o.status,
       la.last_date::text AS last_activity_date,
       la.last_type AS last_activity_type,
       CASE
         WHEN la.last_date IS NULL THEN NULL
         ELSE (CURRENT_DATE - la.last_date::date)
       END::text AS days_since_activity,
       COALESCE(of.net_fee, 0)::text AS expected_fee
     FROM opportunities o
     LEFT JOIN companies lc ON lc.id::text = o.company_id::text
     LEFT JOIN last_activity la ON la.opportunity_id = o.id
     LEFT JOIN opp_fees of ON of.opportunity_id = o.id
     WHERE o.status NOT IN ${OPEN_STATUS_SQL}
       AND (la.last_date IS NULL OR (CURRENT_DATE - la.last_date::date) >= 14)
     ORDER BY la.last_date ASC NULLS FIRST, o.client_name ASC
     LIMIT ${DASHBOARD_TABLE_LIMIT}`,
  );
  return rows.map((r) => ({
    opportunity_id: num(r.opportunity_id),
    opportunity_name: String(r.opportunity_name ?? ""),
    company_name: r.company_name != null ? String(r.company_name) : null,
    status: String(r.status ?? ""),
    last_activity_date: r.last_activity_date != null ? String(r.last_activity_date).slice(0, 10) : null,
    last_activity_type: r.last_activity_type != null ? String(r.last_activity_type) : null,
    days_since_activity:
      r.days_since_activity != null ? num(r.days_since_activity) : null,
    expected_fee: num(r.expected_fee),
  }));
}

async function fetchUpcomingActivities(): Promise<DashboardUpcomingActivity[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT
       a.activity_id,
       a.activity_date::text AS activity_date,
       a.activity_type,
       c.company_name,
       ct.contact_name,
       a.opportunity_id::text AS opportunity_id,
       o.client_name AS opportunity_name,
       prem_agg.labels AS premises_label
     FROM activities a
     LEFT JOIN companies c ON c.id::text = a.company_id::text
     LEFT JOIN contacts ct ON ct.id::text = a.contact_id::text
     LEFT JOIN opportunities o ON o.id::text = a.opportunity_id::text
     LEFT JOIN LATERAL (
       SELECT string_agg(lbl, ', ' ORDER BY lbl) AS labels
       FROM (
         SELECT DISTINCT trim(both ' ' FROM concat_ws(' · ', pr2.bldg_name_en, NULLIF(concat_ws(' / ', p2.floor, p2.unit), ''))) AS lbl
         FROM (
           SELECT a.premises_id AS pid WHERE a.premises_id IS NOT NULL
           UNION ALL
           SELECT ap.premises_id FROM activity_premises ap WHERE ap.activity_id = a.activity_id
         ) ids
         JOIN premises_v1 p2 ON p2.premises_id = ids.pid
         JOIN properties_v1 pr2 ON pr2.property_id = p2.property_id
         WHERE ids.pid IS NOT NULL
       ) labeled
     ) prem_agg ON TRUE
     WHERE a.activity_date >= CURRENT_DATE
       AND a.activity_date <= CURRENT_DATE + INTERVAL '14 days'
       AND a.activity_type IN (
         'Site Tour', 'Site Inspection', 'Meeting', 'Call',
         'Follow-up', 'Follow Up', 'Proposal Sent', 'Proposal Review'
       )
     ORDER BY a.activity_date ASC, a.activity_time ASC NULLS LAST, a.id ASC
     LIMIT ${DASHBOARD_TABLE_LIMIT}`,
  );
  return rows.map((r) => ({
    activity_id: String(r.activity_id),
    activity_date: String(r.activity_date).slice(0, 10),
    activity_type: String(r.activity_type),
    company_name: r.company_name != null ? String(r.company_name) : null,
    contact_name: r.contact_name != null ? String(r.contact_name) : null,
    opportunity_id: r.opportunity_id != null ? num(r.opportunity_id) : null,
    opportunity_name: r.opportunity_name != null ? String(r.opportunity_name) : null,
    premises_label: r.premises_label != null ? String(r.premises_label) : null,
  }));
}

async function fetchRevenuePipeline(): Promise<{
  rows: DashboardRevenueRow[];
  totals: DashboardData["revenue_totals"];
}> {
  const rows = await query<Record<string, unknown>>(
    `WITH opp_fees AS (
       SELECT
         o.id,
         o.status,
         EXISTS (
           SELECT 1 FROM opportunity_proposed_premises pp
           WHERE pp.opportunity_id = o.id AND pp.status = 'viewing'
         ) AS has_viewing,
         COALESCE(SUM(pp.collect_fee_amount), 0) - COALESCE(SUM(pp.paid_out_fee_amount), 0) AS expected_fee,
         COALESCE(SUM(
           CASE WHEN pp.collect_fee_status IN ('confirmed', 'invoiced', 'paid')
             THEN pp.collect_fee_amount ELSE 0 END
         ), 0) - COALESCE(SUM(
           CASE WHEN pp.paid_out_status IN ('confirmed', 'invoiced', 'paid')
             THEN pp.paid_out_fee_amount ELSE 0 END
         ), 0) AS confirmed_fee
       FROM opportunities o
       LEFT JOIN opportunity_proposed_premises pp ON pp.opportunity_id = o.id
       WHERE o.status NOT IN ('closed_lost')
       GROUP BY o.id, o.status
     ),
     bucketed AS (
       SELECT
         CASE
           WHEN status = 'closed_won' THEN 'won'
           WHEN status = 'negotiating' THEN 'negotiation'
           WHEN has_viewing THEN 'viewing'
           WHEN status IN ('proposal_sent', 'proposal_preparing') THEN 'proposal_sent'
           WHEN status IN ('sourcing', 'qualifying') THEN 'sourcing'
           ELSE 'new'
         END AS bucket,
         expected_fee,
         confirmed_fee
       FROM opp_fees
     )
     SELECT
       bucket,
       COUNT(*)::text AS opp_count,
       COALESCE(SUM(expected_fee), 0)::text AS expected_fee,
       COALESCE(SUM(confirmed_fee), 0)::text AS confirmed_fee
     FROM bucketed
     GROUP BY bucket`,
  );

  const labelMap: Record<string, string> = {
    new: "New",
    sourcing: "Sourcing",
    proposal_sent: "Proposal Sent",
    viewing: "Viewing",
    negotiation: "Negotiation",
    won: "Won",
  };
  const order = ["new", "sourcing", "proposal_sent", "viewing", "negotiation", "won"];

  const mapped = rows.map((r) => ({
    bucket: String(r.bucket),
    label: labelMap[String(r.bucket)] ?? String(r.bucket),
    opp_count: num(r.opp_count),
    expected_fee: num(r.expected_fee),
    confirmed_fee: num(r.confirmed_fee),
  }));

  const byBucket = new Map(mapped.map((r) => [r.bucket, r]));
  const ordered = order
    .map((b) => byBucket.get(b))
    .filter((r): r is DashboardRevenueRow => r != null);

  const totals = ordered.reduce(
    (acc, r) => ({
      opp_count: acc.opp_count + r.opp_count,
      expected_fee: acc.expected_fee + r.expected_fee,
      confirmed_fee: acc.confirmed_fee + r.confirmed_fee,
    }),
    { opp_count: 0, expected_fee: 0, confirmed_fee: 0 },
  );

  return { rows: ordered, totals };
}

async function fetchTopReferrers(): Promise<DashboardPartyPerformanceRow[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT
       op.company_id::text,
       op.contact_id::text,
       COALESCE(ct.contact_name, c.company_name) AS party_name,
       COUNT(DISTINCT o.id) FILTER (WHERE o.status NOT IN ${OPEN_STATUS_SQL})::text AS active_opps,
       COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'closed_won')::text AS won_opps,
       COALESCE(SUM(op.paid_out_fee_amount), 0)::text AS expected_fee,
       COALESCE(SUM(
         CASE WHEN op.collect_fee_status = 'paid' THEN op.paid_out_fee_amount ELSE 0 END
       ), 0)::text AS collected_fee
     FROM opportunity_parties op
     JOIN companies c ON c.id::text = op.company_id::text
     LEFT JOIN contacts ct ON ct.id::text = op.contact_id::text
     JOIN opportunities o ON o.id::text = op.opportunity_id::text
     WHERE op.role IN ('referrer')
     GROUP BY op.company_id, op.contact_id, party_name
     ORDER BY active_opps DESC, expected_fee DESC
     LIMIT ${DASHBOARD_TABLE_LIMIT}`,
  );
  return rows.map((r) => ({
    company_id: num(r.company_id),
    contact_id: r.contact_id != null && String(r.contact_id) !== "" ? num(r.contact_id) : null,
    party_name: String(r.party_name ?? ""),
    active_opps: num(r.active_opps),
    won_opps: num(r.won_opps),
    expected_fee: num(r.expected_fee),
    collected_fee: num(r.collected_fee),
  }));
}

async function fetchTopAgents(): Promise<DashboardPartyPerformanceRow[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT
       op.company_id::text,
       op.contact_id::text,
       COALESCE(ct.contact_name, c.company_name) AS party_name,
       COUNT(DISTINCT o.id) FILTER (WHERE o.status NOT IN ${OPEN_STATUS_SQL})::text AS active_opps,
       COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'closed_won')::text AS won_opps,
       COALESCE(SUM(op.collect_fee_amount), 0)::text AS expected_fee,
       COALESCE(SUM(
         CASE WHEN op.collect_fee_status = 'paid' THEN op.collect_fee_amount ELSE 0 END
       ), 0)::text AS collected_fee
     FROM opportunity_parties op
     JOIN companies c ON c.id::text = op.company_id::text
     LEFT JOIN contacts ct ON ct.id::text = op.contact_id::text
     JOIN opportunities o ON o.id::text = op.opportunity_id::text
     WHERE op.role IN ('agent', 'referring_agent', 'co_broker')
        OR op.partnership_mode = 'co_broker'
     GROUP BY op.company_id, op.contact_id, party_name
     ORDER BY active_opps DESC, expected_fee DESC
     LIMIT ${DASHBOARD_TABLE_LIMIT}`,
  );
  return rows.map((r) => ({
    company_id: num(r.company_id),
    contact_id: r.contact_id != null && String(r.contact_id) !== "" ? num(r.contact_id) : null,
    party_name: String(r.party_name ?? ""),
    active_opps: num(r.active_opps),
    won_opps: num(r.won_opps),
    expected_fee: num(r.expected_fee),
    collected_fee: num(r.collected_fee),
  }));
}

async function fetchTopProposedPremises(): Promise<DashboardProposedPremisesRow[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT
       pp.premises_id,
       trim(both ' ' FROM concat_ws(' · ', pr.bldg_name_en, NULLIF(concat_ws(' / ', p.floor, p.unit), ''))) AS premises_label,
       op_co.company_name_en AS operator_name,
       COUNT(*)::text AS proposal_count,
       COUNT(*) FILTER (WHERE pp.status = 'viewing')::text AS viewing_count,
       COUNT(*) FILTER (WHERE pp.status = 'won')::text AS won_count
     FROM opportunity_proposed_premises pp
     JOIN premises_v1 p ON p.premises_id = pp.premises_id
     JOIN properties_v1 pr ON pr.property_id = p.property_id
     LEFT JOIN companies_v1 op_co ON op_co.company_id = p.operator_company_id
     GROUP BY pp.premises_id, premises_label, operator_name
     ORDER BY proposal_count DESC, viewing_count DESC
     LIMIT ${DASHBOARD_TABLE_LIMIT}`,
  );
  return rows.map((r) => ({
    premises_id: String(r.premises_id),
    premises_label: String(r.premises_label ?? r.premises_id),
    operator_name: r.operator_name != null ? String(r.operator_name) : null,
    proposal_count: num(r.proposal_count),
    viewing_count: num(r.viewing_count),
    won_count: num(r.won_count),
  }));
}

async function fetchOperatorPerformance(): Promise<DashboardOperatorRow[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT
       p.operator_company_id,
       COALESCE(op_co.company_name_en, 'Unknown operator') AS operator_name,
       COUNT(*)::text AS proposed_count,
       COUNT(*) FILTER (WHERE pp.status IN ('viewing', 'presented', 'shortlisted'))::text AS viewed_count,
       COUNT(*) FILTER (WHERE pp.status = 'won')::text AS won_count
     FROM opportunity_proposed_premises pp
     JOIN premises_v1 p ON p.premises_id = pp.premises_id
     LEFT JOIN companies_v1 op_co ON op_co.company_id = p.operator_company_id
     GROUP BY p.operator_company_id, operator_name
     HAVING COUNT(*) >= 1
     ORDER BY proposed_count DESC
     LIMIT ${DASHBOARD_TABLE_LIMIT}`,
  );
  return rows.map((r) => {
    const proposed = num(r.proposed_count);
    const won = num(r.won_count);
    return {
      operator_company_id: r.operator_company_id != null ? String(r.operator_company_id) : null,
      operator_name: String(r.operator_name),
      proposed_count: proposed,
      viewed_count: num(r.viewed_count),
      won_count: won,
      win_rate: proposed > 0 ? won / proposed : null,
    };
  });
}

async function fetchRelationshipNetwork(): Promise<DashboardRelationshipNode[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT
       ct.id::text AS contact_id,
       COALESCE(ct.display_name, ct.contact_name) AS contact_name,
       c.id::text AS company_id,
       c.company_name,
       (SELECT COUNT(*)::text FROM opportunities o
         WHERE o.company_id = c.id AND o.status NOT IN ${OPEN_STATUS_SQL}) AS active_opps,
       (SELECT COUNT(*)::text FROM opportunities o
         WHERE o.company_id = c.id AND o.status = 'closed_won') AS won_opps
     FROM relationships r
     JOIN contacts ct ON ct.id::text = r.from_entity_id
     JOIN companies c ON c.id::text = r.to_entity_id
     WHERE r.from_entity_type = 'contact'
       AND r.to_entity_type = 'company'
       AND r.relationship_type = 'Refers'
       AND r.status = 'Active'
     ORDER BY contact_name ASC, company_name ASC
     LIMIT 100`,
  );

  const contactIntroducedContacts = await query<{ contact_id: string; n: string }>(
    `SELECT r.from_entity_id AS contact_id, COUNT(*)::text AS n
     FROM relationships r
     WHERE r.from_entity_type = 'contact'
       AND r.to_entity_type = 'contact'
       AND r.relationship_type = 'Refers'
       AND r.status = 'Active'
     GROUP BY r.from_entity_id`,
  );
  const introContactsMap = new Map(contactIntroducedContacts.map((r) => [r.contact_id, num(r.n)]));

  const byContact = new Map<number, DashboardRelationshipNode>();

  for (const row of rows) {
    const contactId = num(row.contact_id);
    const companyId = num(row.company_id);
    const activeOpps = num(row.active_opps);
    const wonOpps = num(row.won_opps);

    let node = byContact.get(contactId);
    if (!node) {
      node = {
        contact_id: contactId,
        contact_name: String(row.contact_name ?? ""),
        introduced_companies: 0,
        introduced_contacts: introContactsMap.get(String(contactId)) ?? 0,
        active_opportunities: 0,
        won_opportunities: 0,
        companies: [],
      };
      byContact.set(contactId, node);
    }

    node.introduced_companies += 1;
    node.active_opportunities += activeOpps;
    node.won_opportunities += wonOpps;
    node.companies.push({
      company_id: companyId,
      company_name: String(row.company_name ?? ""),
      active_opportunities: activeOpps,
      won_opportunities: wonOpps,
    });
  }

  return [...byContact.values()]
    .sort((a, b) => b.active_opportunities - a.active_opportunities || a.contact_name.localeCompare(b.contact_name))
    .slice(0, DASHBOARD_TABLE_LIMIT);
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [
    pipeline,
    attention,
    upcoming_activities,
    revenue,
    top_referrers,
    top_agents,
    top_proposed_premises,
    operator_performance,
    relationship_network,
  ] = await Promise.all([
    fetchPipelineKpis(),
    fetchAttentionRequired(),
    fetchUpcomingActivities(),
    fetchRevenuePipeline(),
    fetchTopReferrers(),
    fetchTopAgents(),
    fetchTopProposedPremises(),
    fetchOperatorPerformance(),
    fetchRelationshipNetwork(),
  ]);

  return {
    pipeline,
    attention,
    upcoming_activities,
    revenue_pipeline: revenue.rows,
    revenue_totals: revenue.totals,
    top_referrers,
    top_agents,
    top_proposed_premises,
    operator_performance,
    relationship_network,
  };
}
