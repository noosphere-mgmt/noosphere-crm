import { cache } from "react";
import { query } from "@/lib/db";
import { allocateNextBusinessId, ensureLegacyBusinessId, registerBusinessId } from "@/lib/businessIdResolve";
import { coerceLegacyContactId } from "@/lib/entityRefGuards";
import { resolveContactName, sqlContactDisplayName, syncContactDerivedNames } from "@/lib/contactName";
import { normalizePhoneAreaCode } from "@/lib/phoneAreaCodes";
import type { CompanyRole, Contact } from "@/lib/types/entities";

const contactSelect = `
  c.id, c.company_id, c.contact_name, c.first_name, c.last_name, c.chinese_name, c.display_name,
  c.title, c.email, c.phone, c.phone_area_code, c.mobile, c.mobile_area_code,
  c.whatsapp, c.whatsapp_area_code, c.wechat, c.preferred_language, c.contact_role, c.coverage, c.locate_at, c.is_primary,
  c.last_contact_date::text, c.next_follow_up_date::text,
  c.notes, c.is_active, c.created_at::text, c.updated_at::text,
  (SELECT MAX(a.activity_date)::text FROM activities a WHERE a.contact_id = c.id) AS last_activity_date
`;

export type ContactInput = {
  company_id?: number | null;
  first_name?: string | null;
  last_name?: string | null;
  chinese_name?: string | null;
  display_name?: string | null;
  contact_name?: string | null;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  phone_area_code?: string | null;
  mobile?: string | null;
  mobile_area_code?: string | null;
  whatsapp?: string | null;
  whatsapp_area_code?: string | null;
  wechat?: string | null;
  preferred_language?: string | null;
  contact_role?: CompanyRole[];
  coverage?: string[];
  locate_at?: string | null;
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
    normalizePhoneAreaCode(synced.phone_area_code),
    synced.mobile?.trim() || null,
    normalizePhoneAreaCode(synced.mobile_area_code),
    synced.whatsapp?.trim() || null,
    normalizePhoneAreaCode(synced.whatsapp_area_code),
    synced.wechat?.trim() || null,
    synced.preferred_language?.trim() || null,
    parseRoles(synced.contact_role),
    parseCoverage(synced.coverage),
    synced.locate_at?.trim() || null,
    synced.is_primary ?? false,
    synced.last_contact_date?.trim() || null,
    synced.next_follow_up_date?.trim() || null,
    synced.notes?.trim() || null,
    synced.is_active ?? true,
  ];
}

async function clearPrimaryForCompany(companyId: number | null | undefined, exceptId?: number): Promise<void> {
  if (companyId == null) return;
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
    `SELECT ${contactSelect}, co.company_name, co.company_name_zh, co.country AS company_country, co.city AS company_city,
            COALESCE(co.business_id, cv.business_id) AS company_business_id,
            COALESCE(c.business_id, cm.business_id) AS business_id,
            cm.contact_id AS v1_contact_id
     FROM contacts c
     LEFT JOIN companies co ON co.id::text = c.company_id::text
     LEFT JOIN companies_v1 cv ON cv.legacy_company_id = co.id
     LEFT JOIN contacts_v1 cm ON cm.legacy_contact_id = c.id
     WHERE c.company_id::text = $1::text
     ORDER BY c.is_primary DESC, ${sqlContactDisplayName("c")} ASC`,
    [companyId],
  );
  }
  return query<Contact>(
    `SELECT ${contactSelect}, co.company_name, co.company_name_zh, co.country AS company_country, co.city AS company_city,
            COALESCE(co.business_id, cv.business_id) AS company_business_id,
            COALESCE(opp.open_opportunities, 0)::int AS open_opportunities,
            COALESCE(c.business_id, cm.business_id) AS business_id,
            cm.contact_id AS v1_contact_id
     FROM contacts c
     LEFT JOIN companies co ON co.id::text = c.company_id::text
     LEFT JOIN companies_v1 cv ON cv.legacy_company_id = co.id
     LEFT JOIN contacts_v1 cm ON cm.legacy_contact_id = c.id
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
  company_id: number | null;
  company_ref?: string | null;
  contact_name: string;
  is_primary: boolean;
  business_id?: string | null;
  v1_contact_id?: string | null;
};

export const listContactOptions = cache(async function listContactOptions(): Promise<ContactOption[]> {
  return query<ContactOption>(
    `SELECT c.id,
            CASE WHEN c.company_id::text ~ '^\\d+$' THEN c.company_id::text::int ELSE co.id END AS company_id,
            c.company_id::text AS company_ref,
            ${sqlContactDisplayName("c")} AS contact_name,
            c.is_primary,
            COALESCE(c.business_id, cm.business_id) AS business_id,
            cm.contact_id AS v1_contact_id
     FROM contacts c
     LEFT JOIN companies co ON co.id::text = c.company_id::text
     LEFT JOIN contacts_v1 cm ON cm.legacy_contact_id = c.id
     WHERE c.is_active = TRUE
     ORDER BY company_id, c.is_primary DESC, ${sqlContactDisplayName("c")} ASC`,
  );
});

export async function getContact(id: number | string): Promise<Contact | null> {
  const legacyId = coerceLegacyContactId(id);
  if (legacyId == null) return null;

  const rows = await query<Contact>(
    `SELECT ${contactSelect}, co.company_name, co.company_name_zh, co.country AS company_country, co.city AS company_city,
            COALESCE(c.business_id, cm.business_id) AS business_id,
            cm.contact_id AS v1_contact_id
     FROM contacts c
     LEFT JOIN companies co ON co.id::text = c.company_id::text
     LEFT JOIN contacts_v1 cm ON cm.legacy_contact_id = c.id
     WHERE c.id = $1`,
    [legacyId],
  );
  return rows[0] ?? null;
}

export async function createContact(input: ContactInput): Promise<number> {
  if (input.is_primary) {
    await clearPrimaryForCompany(input.company_id);
  }
  const businessId = await allocateNextBusinessId("contact");
  const rows = await query<{ id: string }>(
    `INSERT INTO contacts (
       company_id, contact_name, first_name, last_name, chinese_name, display_name,
       title, email, phone, phone_area_code, mobile, mobile_area_code,
       whatsapp, whatsapp_area_code, wechat,
       preferred_language, contact_role, coverage, locate_at, is_primary, last_contact_date, next_follow_up_date,
       notes, is_active, business_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
     RETURNING id::text AS id`,
    [...contactValues(input), businessId],
  );
  const id = Number.parseInt(rows[0]!.id, 10);
  await registerBusinessId({
    entityType: "contact",
    businessId,
    primaryRef: String(id),
    legacyNumeric: id,
  });
  return id;
}

export async function duplicateContact(id: number | string): Promise<number> {
  const row = await getContact(id);
  if (!row) throw new Error("Contact not found");

  const label = resolveContactName(row) || "Contact";
  const copyLabel = label.endsWith(" (copy)") ? label : `${label} (copy)`;

  return createContact({
    company_id: row.company_id,
    // Force display via contact_name/display_name (composed first/last/chinese would drop the suffix).
    first_name: null,
    last_name: null,
    chinese_name: null,
    display_name: copyLabel,
    contact_name: copyLabel,
    title: row.title,
    email: row.email,
    phone: row.phone,
    phone_area_code: row.phone_area_code ?? null,
    mobile: row.mobile ?? null,
    mobile_area_code: row.mobile_area_code ?? null,
    whatsapp: row.whatsapp,
    whatsapp_area_code: row.whatsapp_area_code ?? null,
    wechat: row.wechat,
    preferred_language: row.preferred_language,
    contact_role: row.contact_role ?? [],
    coverage: row.coverage ?? [],
    locate_at: row.locate_at,
    is_primary: false,
    last_contact_date: row.last_contact_date,
    next_follow_up_date: row.next_follow_up_date,
    notes: row.notes,
    is_active: row.is_active,
  });
}

async function assignContactBusinessId(contactId: number): Promise<string> {
  return ensureLegacyBusinessId("contact", contactId);
}

export async function updateContact(id: number, input: ContactInput): Promise<void> {
  if (input.is_primary) {
    await clearPrimaryForCompany(input.company_id, id);
  }
  await query(
    `UPDATE contacts SET
       company_id = $2, contact_name = $3, first_name = $4, last_name = $5, chinese_name = $6, display_name = $7,
       title = $8, email = $9, phone = $10, phone_area_code = $11, mobile = $12, mobile_area_code = $13,
       whatsapp = $14, whatsapp_area_code = $15, wechat = $16, preferred_language = $17, contact_role = $18,
       coverage = $19, locate_at = $20,
       is_primary = $21, last_contact_date = $22, next_follow_up_date = $23, notes = $24, is_active = $25
     WHERE id = $1`,
    [id, ...contactValues(input)],
  );
  await ensureLegacyBusinessId("contact", id);
}

export async function deleteContact(id: number): Promise<void> {
  await query(`DELETE FROM contacts WHERE id = $1`, [id]);
}

export async function bulkDeleteContacts(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await query(`DELETE FROM contacts WHERE id = ANY($1::bigint[])`, [ids]);
}
