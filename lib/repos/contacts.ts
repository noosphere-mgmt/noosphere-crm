import { query } from "@/lib/db";
import { resolveContactName, sqlContactDisplayName, syncContactDerivedNames } from "@/lib/contactName";
import type { CompanyRole, Contact } from "@/lib/types/entities";

const contactSelect = `
  c.id, c.company_id, c.contact_name, c.first_name, c.last_name, c.chinese_name, c.display_name,
  c.title, c.email, c.phone,
  c.whatsapp, c.wechat, c.preferred_language, c.contact_role, c.coverage, c.is_primary,
  c.last_contact_date::text, c.next_follow_up_date::text,
  c.notes, c.is_active, c.created_at::text, c.updated_at::text,
  (SELECT MAX(a.activity_date)::text FROM activities a WHERE a.contact_id = c.id) AS last_activity_date
`;

export type ContactInput = {
  company_id: number;
  first_name?: string | null;
  last_name?: string | null;
  chinese_name?: string | null;
  display_name?: string | null;
  contact_name?: string | null;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  wechat?: string | null;
  preferred_language?: string | null;
  contact_role?: CompanyRole[];
  coverage?: string[];
  is_primary?: boolean;
  last_contact_date?: string | null;
  next_follow_up_date?: string | null;
  notes?: string | null;
  is_active?: boolean;
};

function parseRoles(values: unknown): CompanyRole[] {
  if (!Array.isArray(values)) return [];
  return values.map(String).filter(Boolean) as CompanyRole[];
}

function parseCoverage(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map(String).filter(Boolean);
}

function contactValues(input: ContactInput) {
  const synced = syncContactDerivedNames(input);
  const contactName = resolveContactName(synced);
  return [
    synced.company_id,
    contactName,
    synced.first_name?.trim() || null,
    synced.last_name?.trim() || null,
    synced.chinese_name?.trim() || null,
    synced.display_name?.trim() || contactName || null,
    synced.title?.trim() || null,
    synced.email?.trim() || null,
    synced.phone?.trim() || null,
    synced.whatsapp?.trim() || null,
    synced.wechat?.trim() || null,
    synced.preferred_language?.trim() || null,
    parseRoles(synced.contact_role),
    parseCoverage(synced.coverage),
    synced.is_primary ?? false,
    synced.last_contact_date?.trim() || null,
    synced.next_follow_up_date?.trim() || null,
    synced.notes?.trim() || null,
    synced.is_active ?? true,
  ];
}

async function clearPrimaryForCompany(companyId: number, exceptId?: number): Promise<void> {
  if (exceptId != null) {
    await query(
      `UPDATE contacts SET is_primary = FALSE WHERE company_id = $1 AND id <> $2`,
      [companyId, exceptId],
    );
  } else {
    await query(`UPDATE contacts SET is_primary = FALSE WHERE company_id = $1`, [companyId]);
  }
}

export async function listContacts(companyId?: number): Promise<Contact[]> {
  if (companyId != null) {
    return query<Contact>(
      `SELECT ${contactSelect}, co.company_name, co.country AS company_country, co.city AS company_city
       FROM contacts c
       JOIN companies co ON co.id = c.company_id
       WHERE c.company_id = $1
       ORDER BY c.is_primary DESC, ${sqlContactDisplayName("c")} ASC`,
      [companyId],
    );
  }
  return query<Contact>(
    `SELECT ${contactSelect}, co.company_name, co.country AS company_country, co.city AS company_city,
            COALESCE(opp.open_opportunities, 0)::int AS open_opportunities
     FROM contacts c
     JOIN companies co ON co.id = c.company_id
     LEFT JOIN LATERAL (
       SELECT COUNT(DISTINCT o.id)::int AS open_opportunities
       FROM opportunities o
       LEFT JOIN opportunity_parties op ON op.opportunity_id = o.id AND op.contact_id = c.id
       WHERE (o.primary_contact_id = c.id OR op.contact_id = c.id)
         AND o.status NOT IN ('closed_won', 'closed_lost')
     ) opp ON TRUE
     ORDER BY co.company_name ASC, c.is_primary DESC, ${sqlContactDisplayName("c")} ASC`,
  );
}

export type ContactOption = {
  id: number;
  company_id: number;
  contact_name: string;
  is_primary: boolean;
};

export async function listContactOptions(): Promise<ContactOption[]> {
  return query<ContactOption>(
    `SELECT id, company_id::int AS company_id, ${sqlContactDisplayName()} AS contact_name, is_primary
     FROM contacts WHERE is_active = TRUE
     ORDER BY company_id, is_primary DESC, ${sqlContactDisplayName()} ASC`,
  );
}

export async function getContact(id: number): Promise<Contact | null> {
  const rows = await query<Contact>(
    `SELECT ${contactSelect}, co.company_name, co.country AS company_country, co.city AS company_city
     FROM contacts c
     JOIN companies co ON co.id = c.company_id
     WHERE c.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function createContact(input: ContactInput): Promise<number> {
  if (input.is_primary) {
    await clearPrimaryForCompany(input.company_id);
  }
  const rows = await query<{ id: string }>(
    `INSERT INTO contacts (
       company_id, contact_name, first_name, last_name, chinese_name, display_name,
       title, email, phone, whatsapp, wechat,
       preferred_language, contact_role, coverage, is_primary, last_contact_date, next_follow_up_date,
       notes, is_active
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
     RETURNING id::text AS id`,
    contactValues(input),
  );
  return Number.parseInt(rows[0]!.id, 10);
}

export async function updateContact(id: number, input: ContactInput): Promise<void> {
  if (input.is_primary) {
    await clearPrimaryForCompany(input.company_id, id);
  }
  await query(
    `UPDATE contacts SET
       company_id = $2, contact_name = $3, first_name = $4, last_name = $5, chinese_name = $6, display_name = $7,
       title = $8, email = $9, phone = $10,
       whatsapp = $11, wechat = $12, preferred_language = $13, contact_role = $14, coverage = $15, is_primary = $16,
       last_contact_date = $17, next_follow_up_date = $18, notes = $19, is_active = $20
     WHERE id = $1`,
    [id, ...contactValues(input)],
  );
}

export async function deleteContact(id: number): Promise<void> {
  await query(`DELETE FROM contacts WHERE id = $1`, [id]);
}

export async function bulkDeleteContacts(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await query(`DELETE FROM contacts WHERE id = ANY($1::bigint[])`, [ids]);
}
