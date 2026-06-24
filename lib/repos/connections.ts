import { query } from "@/lib/db";
import { sqlContactDisplayName } from "@/lib/contactName";
import type { ConnectionCompanyListRow } from "@/lib/connectionsDisplay";
import { OPEN_OPPORTUNITY_STATUS_SQL } from "@/lib/openOpportunityStatus";

const companySelect = `
  c.id, c.company_name, c.company_name_zh, c.company_name_cn, c.roles,
  c.coverage, c.country, c.city, c.district,
  c.website, c.phone, c.email,
  c.industry, c.source, c.relationship_owner,
  c.last_contact_date::text, c.last_meeting_date::text, c.next_follow_up_date::text,
  c.relationship_strength, c.notes, c.is_active,
  c.created_at::text, c.updated_at::text
`;

export async function listConnectionCompanies(): Promise<ConnectionCompanyListRow[]> {
  return query<ConnectionCompanyListRow>(
    `SELECT
       ${companySelect},
       pc.contact_name AS primary_contact_name,
       pc.contact_email AS primary_contact_email,
       pc.contact_phone AS primary_contact_phone,
       COALESCE(opp.open_opportunities, 0)::int AS open_opportunities,
       COALESCE(cv.business_id, c.business_id) AS business_id,
       cv.company_id AS v1_company_id
     FROM companies c
     LEFT JOIN companies_v1 cv ON cv.legacy_company_id = c.id
     LEFT JOIN LATERAL (
       SELECT
         ${sqlContactDisplayName()} AS contact_name,
         email AS contact_email,
         phone AS contact_phone
       FROM contacts
       WHERE company_id = c.id AND is_active = TRUE
       ORDER BY is_primary DESC, ${sqlContactDisplayName()} ASC
       LIMIT 1
     ) pc ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(DISTINCT o.id)::int AS open_opportunities
       FROM opportunities o
       LEFT JOIN opportunity_parties op ON op.opportunity_id = o.id AND op.company_id = c.id
       WHERE (o.company_id = c.id OR op.company_id = c.id)
         AND o.status NOT IN ${OPEN_OPPORTUNITY_STATUS_SQL}
     ) opp ON TRUE
     ORDER BY c.company_name ASC, c.id ASC`,
  );
}
