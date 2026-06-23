import { query } from "@/lib/db";
import { isActivityType } from "@/lib/activityValues";
import {
  sqlJoinLegacyCompany,
  sqlJoinLegacyContact,
  sqlJoinLegacyOpportunity,
  sqlJoinV1Company,
} from "@/lib/import/lookupSql";

const premisesLabelLateral = `
  LEFT JOIN LATERAL (
    SELECT string_agg(lbl, ', ' ORDER BY lbl) AS labels
    FROM (
      SELECT DISTINCT trim(both ' ' FROM concat_ws(' · ', pr2.bldg_name_en, NULLIF(concat_ws(' / ', p2.floor, p2.unit), ''))) AS lbl
      FROM (
        SELECT a.premises_id AS pid
        WHERE a.premises_id IS NOT NULL
        UNION ALL
        SELECT ap.premises_id FROM activity_premises ap WHERE ap.activity_id = a.activity_id
      ) ids
      JOIN premises_v1 p2 ON p2.premises_id = ids.pid
      JOIN properties_v1 pr2 ON pr2.property_id = p2.property_id
      WHERE ids.pid IS NOT NULL
    ) labeled
  ) prem_agg ON TRUE
`;

const activitySelect = `
  a.id,
  a.activity_id,
  a.activity_group_id,
  a.activity_date::text AS activity_date,
  a.activity_time,
  a.activity_type,
  a.subject,
  a.notes,
  a.company_id,
  a.contact_id,
  a.opportunity_id,
  a.premises_id,
  a.owner,
  a.created_at::text AS created_at,
  a.updated_at::text AS updated_at,
  c.company_name,
  ct.contact_name,
  o.client_name AS opportunity_name,
  prem_agg.labels AS premises_label,
  cm.new_id AS v1_company_id,
  ctm.new_id AS v1_contact_id,
  om.new_id AS v1_opportunity_id
`;

const activityFrom = `
  FROM activities a
  LEFT JOIN companies c ON ${sqlJoinLegacyCompany("c", "a.company_id")}
  LEFT JOIN contacts ct ON ${sqlJoinLegacyContact("ct", "a.contact_id")}
  LEFT JOIN opportunities o ON ${sqlJoinLegacyOpportunity("o", "a.opportunity_id")}
  LEFT JOIN id_map_v1 cm ON cm.entity_type = 'company' AND cm.legacy_id = a.company_id
  LEFT JOIN id_map_v1 ctm ON ctm.entity_type = 'contact' AND ctm.legacy_id = a.contact_id
  LEFT JOIN id_map_v1 om ON om.entity_type = 'opportunity' AND om.legacy_id = a.opportunity_id
  ${premisesLabelLateral}
`;

export type ActivityListRow = {
  id: number;
  activity_id: string;
  activity_group_id: string | null;
  activity_date: string;
  activity_time: string | null;
  activity_type: string;
  subject: string | null;
  notes: string | null;
  company_id: number | null;
  contact_id: number | null;
  opportunity_id: number | null;
  premises_id: string | null;
  owner: string | null;
  created_at: string;
  updated_at: string;
  company_name: string | null;
  contact_name: string | null;
  opportunity_name: string | null;
  premises_label: string | null;
  v1_company_id?: string | null;
  v1_contact_id?: string | null;
  v1_opportunity_id?: string | null;
};

export type ActivityInput = {
  activity_date: string;
  activity_time?: string | null;
  activity_type: string;
  subject?: string | null;
  notes?: string | null;
  company_id?: number | null;
  contact_id?: number | null;
  opportunity_id?: number | null;
  premises_id?: string | null;
  premises_ids?: string[];
  owner?: string | null;
  activity_group_id?: string | null;
};

export type SiteTourCheckpointMode = "split" | "combined";

function parseActivityInput(input: ActivityInput, options?: { allowMissingPremises?: boolean }) {
  const activityType = input.activity_type.trim();
  if (!isActivityType(activityType)) {
    throw new Error("Invalid activity type");
  }
  const activityDate = input.activity_date.trim();
  if (!activityDate) throw new Error("Activity date is required");

  const hasLink =
    input.company_id != null ||
    input.contact_id != null ||
    input.opportunity_id != null ||
    (input.premises_id?.trim() ?? "") !== "" ||
    (input.premises_ids?.length ?? 0) > 0;

  if (!hasLink && !options?.allowMissingPremises) {
    throw new Error("Link at least one company, contact, opportunity, or premises");
  }

  return {
    activityDate,
    activityTime: input.activity_time?.trim() || null,
    activityType,
    subject: input.subject?.trim() || null,
    notes: input.notes?.trim() || null,
    companyId: input.company_id ?? null,
    contactId: input.contact_id ?? null,
    opportunityId: input.opportunity_id ?? null,
    premisesId: input.premises_id?.trim() || null,
    owner: input.owner?.trim() || null,
  };
}

export async function listActivities(): Promise<ActivityListRow[]> {
  return query<ActivityListRow>(
    `SELECT ${activitySelect}
     ${activityFrom}
     ORDER BY a.activity_date DESC, a.activity_time DESC NULLS LAST, a.id DESC`,
  );
}

export async function getActivity(activityId: string): Promise<ActivityListRow | null> {
  const rows = await query<ActivityListRow>(
    `SELECT ${activitySelect}
     ${activityFrom}
     WHERE a.activity_id = $1`,
    [activityId],
  );
  return rows[0] ?? null;
}

export async function getActivityByNumericId(id: number): Promise<ActivityListRow | null> {
  const rows = await query<ActivityListRow>(
    `SELECT ${activitySelect}
     ${activityFrom}
     WHERE a.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function listActivitiesForCompany(companyId: number): Promise<ActivityListRow[]> {
  return query<ActivityListRow>(
    `SELECT ${activitySelect}
     ${activityFrom}
     WHERE a.company_id = $1
     ORDER BY a.activity_date DESC, a.activity_time DESC NULLS LAST, a.id DESC`,
    [companyId],
  );
}

export async function listActivitiesForContact(contactId: number): Promise<ActivityListRow[]> {
  return query<ActivityListRow>(
    `SELECT ${activitySelect}
     ${activityFrom}
     WHERE a.contact_id = $1
     ORDER BY a.activity_date DESC, a.activity_time DESC NULLS LAST, a.id DESC`,
    [contactId],
  );
}

export async function listActivitiesForOpportunity(opportunityId: number): Promise<ActivityListRow[]> {
  return query<ActivityListRow>(
    `SELECT ${activitySelect}
     ${activityFrom}
     WHERE a.opportunity_id = $1
     ORDER BY a.activity_date DESC, a.activity_time DESC NULLS LAST, a.id DESC`,
    [opportunityId],
  );
}

export async function listActivitiesForPremises(premisesId: string): Promise<ActivityListRow[]> {
  return query<ActivityListRow>(
    `SELECT ${activitySelect}
     ${activityFrom}
     WHERE a.premises_id = $1
        OR EXISTS (
          SELECT 1 FROM activity_premises ap
          WHERE ap.activity_id = a.activity_id AND ap.premises_id = $1
        )
     ORDER BY a.activity_date DESC, a.activity_time DESC NULLS LAST, a.id DESC`,
    [premisesId],
  );
}

function newActivityGroupId(): string {
  return `tour_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listActivityPremisesIds(activityId: string): Promise<string[]> {
  const rows = await query<{ premises_id: string }>(
    `SELECT premises_id FROM activity_premises WHERE activity_id = $1 ORDER BY premises_id ASC`,
    [activityId],
  );
  return rows.map((r) => r.premises_id);
}

export async function syncActivityPremises(activityId: string, premisesIds: string[]): Promise<void> {
  const unique = [...new Set(premisesIds.map((id) => id.trim()).filter(Boolean))];
  await query(`DELETE FROM activity_premises WHERE activity_id = $1`, [activityId]);
  if (unique.length === 0) return;
  await query(
    `INSERT INTO activity_premises (activity_id, premises_id)
     SELECT $1, unnest($2::text[])
     ON CONFLICT DO NOTHING`,
    [activityId, unique],
  );
}

export async function createActivity(input: ActivityInput): Promise<string> {
  const v = parseActivityInput(input);
  const rows = await query<{ activity_id: string }>(
    `INSERT INTO activities (
       activity_id, activity_date, activity_time, activity_type, subject, notes,
       company_id, contact_id, premises_id, opportunity_id, owner, activity_group_id
     ) VALUES (
       'act_' || replace(gen_random_uuid()::text, '-', ''),
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
     )
     RETURNING activity_id`,
    [
      v.activityDate,
      v.activityTime,
      v.activityType,
      v.subject,
      v.notes,
      v.companyId,
      v.contactId,
      v.premisesId,
      v.opportunityId,
      v.owner,
      input.activity_group_id?.trim() || null,
    ],
  );
  return rows[0]!.activity_id;
}

export async function createSiteTourActivities(
  input: ActivityInput,
  premisesIds: string[],
  mode: SiteTourCheckpointMode,
): Promise<string[]> {
  const uniquePremises = [...new Set(premisesIds.map((id) => id.trim()).filter(Boolean))];
  if (uniquePremises.length === 0) {
    throw new Error("Select at least one premises for the site tour");
  }

  const groupId = uniquePremises.length > 1 ? input.activity_group_id?.trim() || newActivityGroupId() : null;

  if (mode === "split") {
    const created: string[] = [];
    for (const premisesId of uniquePremises) {
      const activityId = await createActivity({
        ...input,
        premises_id: premisesId,
        activity_group_id: groupId,
      });
      created.push(activityId);
    }
    return created;
  }

  const activityId = await createActivity({
    ...input,
    premises_id: uniquePremises[0],
    activity_group_id: groupId,
  });
  await syncActivityPremises(activityId, uniquePremises);
  return [activityId];
}

export async function duplicateActivity(activityId: string): Promise<string> {
  const row = await getActivity(activityId);
  if (!row) throw new Error("Activity not found");

  const linkedPremises = await listActivityPremisesIds(activityId);
  const allPremises = [
    ...new Set([row.premises_id, ...linkedPremises].filter((id): id is string => Boolean(id?.trim()))),
  ];

  const today = new Date().toISOString().slice(0, 10);
  const newId = await createActivity({
    activity_date: today,
    activity_time: null,
    activity_type: row.activity_type,
    subject: null,
    notes: row.notes,
    company_id: row.company_id,
    contact_id: row.contact_id,
    opportunity_id: row.opportunity_id,
    premises_id: row.premises_id,
    owner: row.owner,
    activity_group_id: row.activity_group_id,
  });

  if (allPremises.length > 1) {
    await syncActivityPremises(newId, allPremises);
  }

  return newId;
}

export async function updateActivity(activityId: string, input: ActivityInput): Promise<void> {
  const v = parseActivityInput(input);
  await query(
    `UPDATE activities SET
       activity_date = $2,
       activity_time = $3,
       activity_type = $4,
       subject = $5,
       notes = $6,
       company_id = $7,
       contact_id = $8,
       premises_id = $9,
       opportunity_id = $10,
       owner = $11
     WHERE activity_id = $1`,
    [
      activityId,
      v.activityDate,
      v.activityTime,
      v.activityType,
      v.subject,
      v.notes,
      v.companyId,
      v.contactId,
      v.premisesId,
      v.opportunityId,
      v.owner,
    ],
  );
}

export async function deleteActivity(activityId: string): Promise<void> {
  await query(`DELETE FROM activities WHERE activity_id = $1`, [activityId]);
}

export async function getLastActivityDateForCompany(companyId: number): Promise<string | null> {
  const rows = await query<{ activity_date: string }>(
    `SELECT activity_date::text AS activity_date
     FROM activities
     WHERE company_id = $1
     ORDER BY activity_date DESC, id DESC
     LIMIT 1`,
    [companyId],
  );
  return rows[0]?.activity_date?.slice(0, 10) ?? null;
}

export async function getLastActivityDateForContact(contactId: number): Promise<string | null> {
  const rows = await query<{ activity_date: string }>(
    `SELECT activity_date::text AS activity_date
     FROM activities
     WHERE contact_id = $1
     ORDER BY activity_date DESC, id DESC
     LIMIT 1`,
    [contactId],
  );
  return rows[0]?.activity_date?.slice(0, 10) ?? null;
}

export async function getLastActivityDateForOpportunity(opportunityId: number): Promise<string | null> {
  const rows = await query<{ activity_date: string }>(
    `SELECT activity_date::text AS activity_date
     FROM activities
     WHERE opportunity_id = $1
     ORDER BY activity_date DESC, id DESC
     LIMIT 1`,
    [opportunityId],
  );
  return rows[0]?.activity_date?.slice(0, 10) ?? null;
}

export async function getLastActivityDateForPremises(premisesId: string): Promise<string | null> {
  const rows = await query<{ activity_date: string }>(
    `SELECT activity_date::text AS activity_date
     FROM activities
     WHERE premises_id = $1
     ORDER BY activity_date DESC, id DESC
     LIMIT 1`,
    [premisesId],
  );
  return rows[0]?.activity_date?.slice(0, 10) ?? null;
}

export type ActivityLinkSearchHit = {
  entity_type: "company" | "contact" | "opportunity" | "premises";
  entity_id: string;
  label: string;
  subtitle: string | null;
};

export async function searchActivityCompanies(q: string, limit = 15): Promise<ActivityLinkSearchHit[]> {
  const term = q.trim();
  const companyLabelSql = `CASE WHEN cm.new_id IS NOT NULL
    THEN c.company_name || ' (' || cm.new_id || ')'
    ELSE c.company_name END`;
  const companyFrom = `FROM companies c LEFT JOIN id_map_v1 cm ON cm.entity_type = 'company' AND cm.legacy_id = c.id`;
  if (!term) {
    return query<ActivityLinkSearchHit>(
      `SELECT 'company'::text AS entity_type,
              c.id::text AS entity_id,
              ${companyLabelSql} AS label,
              NULL::text AS subtitle
       ${companyFrom}
       WHERE c.is_active = TRUE
       ORDER BY c.company_name ASC
       LIMIT $1`,
      [limit],
    );
  }
  return query<ActivityLinkSearchHit>(
    `SELECT 'company'::text AS entity_type,
            c.id::text AS entity_id,
            ${companyLabelSql} AS label,
            NULL::text AS subtitle
     ${companyFrom}
     WHERE c.is_active = TRUE AND c.company_name ILIKE $1
     ORDER BY c.company_name ASC
     LIMIT $2`,
    [`%${term}%`, limit],
  );
}

export async function searchActivityContacts(q: string, limit = 15): Promise<ActivityLinkSearchHit[]> {
  const term = q.trim();
  const contactLabelSql = `CASE WHEN cm.new_id IS NOT NULL
    THEN COALESCE(c.display_name, c.contact_name) || ' (' || cm.new_id || ')'
    ELSE COALESCE(c.display_name, c.contact_name) END`;
  const contactFrom = `
    FROM contacts c
    JOIN companies co ON co.id::text = c.company_id::text
    LEFT JOIN id_map_v1 cm ON cm.entity_type = 'contact' AND cm.legacy_id = c.id`;
  if (!term) {
    return query<ActivityLinkSearchHit>(
      `SELECT 'contact'::text AS entity_type,
              c.id::text AS entity_id,
              ${contactLabelSql} AS label,
              co.company_name AS subtitle
       ${contactFrom}
       WHERE c.is_active = TRUE
       ORDER BY COALESCE(c.display_name, c.contact_name) ASC
       LIMIT $1`,
      [limit],
    );
  }
  return query<ActivityLinkSearchHit>(
    `SELECT 'contact'::text AS entity_type,
            c.id::text AS entity_id,
            ${contactLabelSql} AS label,
            co.company_name AS subtitle
     ${contactFrom}
     WHERE c.is_active = TRUE
       AND (COALESCE(c.display_name, c.contact_name) ILIKE $1 OR co.company_name ILIKE $1)
     ORDER BY COALESCE(c.display_name, c.contact_name) ASC
     LIMIT $2`,
    [`%${term}%`, limit],
  );
}

export async function searchActivityOpportunities(q: string, limit = 15): Promise<ActivityLinkSearchHit[]> {
  const term = q.trim();
  const opportunityLabelSql = `CASE WHEN om.new_id IS NOT NULL
    THEN o.client_name || ' (' || om.new_id || ')'
    ELSE o.client_name END`;
  const opportunityFrom = `
    FROM opportunities o
    LEFT JOIN companies c ON c.id::text = o.company_id::text
    LEFT JOIN id_map_v1 om ON om.entity_type = 'opportunity' AND om.legacy_id = o.id`;
  if (!term) {
    return query<ActivityLinkSearchHit>(
      `SELECT 'opportunity'::text AS entity_type,
              o.id::text AS entity_id,
              ${opportunityLabelSql} AS label,
              c.company_name AS subtitle
       ${opportunityFrom}
       ORDER BY o.updated_at DESC NULLS LAST, o.id DESC
       LIMIT $1`,
      [limit],
    );
  }
  return query<ActivityLinkSearchHit>(
    `SELECT 'opportunity'::text AS entity_type,
            o.id::text AS entity_id,
            ${opportunityLabelSql} AS label,
            c.company_name AS subtitle
     ${opportunityFrom}
     WHERE o.client_name ILIKE $1 OR c.company_name ILIKE $1
     ORDER BY o.updated_at DESC NULLS LAST, o.id DESC
     LIMIT $2`,
    [`%${term}%`, limit],
  );
}

export async function searchActivityPremises(q: string, limit = 25): Promise<ActivityLinkSearchHit[]> {
  const term = q.trim();
  const premisesLabelSql = `trim(both ' ' FROM concat_ws(' - ',
    NULLIF(trim(pr.bldg_name_en), ''),
    NULLIF(trim(concat_ws(' - ',
      CASE
        WHEN coalesce(trim(p.floor), '') = '' THEN NULL
        WHEN trim(p.floor) ~* '/f$' THEN trim(p.floor)
        ELSE trim(p.floor) || '/F'
      END,
      CASE
        WHEN coalesce(trim(p.unit), '') = '' THEN NULL
        ELSE '#' || trim(leading '#' from trim(p.unit))
      END
    )), '')
  ))`;

  const premisesFrom = `
    FROM premises_v1 p
    JOIN properties_v1 pr ON pr.property_id = p.property_id
    LEFT JOIN companies_v1 op ON ${sqlJoinV1Company("op", "NULLIF(trim(p.operator_company_id), '')")}
  `;

  if (!term) {
    return query<ActivityLinkSearchHit>(
      `SELECT 'premises'::text AS entity_type,
              p.premises_id AS entity_id,
              CASE
                WHEN NULLIF(${premisesLabelSql}, '') IS NOT NULL
                THEN ${premisesLabelSql} || ' (' || p.premises_id || ')'
                ELSE p.premises_id
              END AS label,
              trim(both ' · ' FROM concat_ws(' · ', pr.district_en, op.company_name_en)) AS subtitle
       ${premisesFrom}
       ORDER BY pr.bldg_name_en ASC NULLS LAST, p.floor ASC NULLS LAST, p.unit ASC NULLS LAST
       LIMIT $1`,
      [limit],
    );
  }

  return query<ActivityLinkSearchHit>(
    `SELECT 'premises'::text AS entity_type,
            p.premises_id AS entity_id,
            CASE
              WHEN NULLIF(${premisesLabelSql}, '') IS NOT NULL
              THEN ${premisesLabelSql} || ' (' || p.premises_id || ')'
              ELSE p.premises_id
            END AS label,
            trim(both ' · ' FROM concat_ws(' · ', pr.district_en, op.company_name_en)) AS subtitle
     ${premisesFrom}
     WHERE pr.bldg_name_en ILIKE $1
        OR pr.district_en ILIKE $1
        OR op.company_name_en ILIKE $1
        OR p.floor ILIKE $1
        OR p.unit ILIKE $1
        OR p.premises_id ILIKE $1
        OR p.property_name_en ILIKE $1
        OR concat_ws(' ', pr.bldg_name_en, pr.district_en, op.company_name_en, p.floor, p.unit) ILIKE $1
     ORDER BY pr.bldg_name_en ASC NULLS LAST, p.floor ASC NULLS LAST, p.unit ASC NULLS LAST
     LIMIT $2`,
    [`%${term}%`, limit],
  );
}

/** @deprecated use ActivityListRow */
export type ActivityTimelineItem = ActivityListRow;

export async function listCompanyTimeline(companyId: number): Promise<ActivityListRow[]> {
  return listActivitiesForCompany(companyId);
}
