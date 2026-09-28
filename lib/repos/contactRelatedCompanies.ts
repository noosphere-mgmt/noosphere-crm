import { query } from "@/lib/db";
import { sqlContactDisplayName } from "@/lib/contactName";
import { sqlContactListVisible } from "@/lib/contactVisibility";
import {
  isContactRelatedCompanyRole,
  type ContactRelatedCompanyRole,
} from "@/lib/contactRelatedCompanies";

export type ContactRelatedCompany = {
  id: number;
  contact_id: number;
  company_id: number;
  relationship_role: string;
  notes: string | null;
  company_name: string | null;
  company_business_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyRelatedContact = {
  id: number;
  contact_id: number;
  contact_name: string;
  contact_business_id: string | null;
  primary_company_id: number | null;
  primary_company_name: string | null;
  primary_company_business_id: string | null;
  relationship_role: string;
  notes: string | null;
};

function normalizeRole(role: string): ContactRelatedCompanyRole {
  const value = role.trim();
  if (!isContactRelatedCompanyRole(value)) {
    throw new Error("Choose a relationship role");
  }
  return value;
}

async function assertNotPrimaryCompany(contactId: number, companyId: number): Promise<void> {
  const rows = await query<{ company_id: number | null }>(
    `SELECT company_id FROM contacts WHERE id = $1`,
    [contactId],
  );
  const primaryId = rows[0]?.company_id == null ? null : Number(rows[0].company_id);
  if (primaryId != null && primaryId === companyId) {
    throw new Error("This company is already the contact's primary company.");
  }
}

export async function assertPrimaryCompanyNotRelated(
  contactId: number,
  companyId: number | null | undefined,
): Promise<void> {
  if (companyId == null) return;
  const rows = await query<{ id: string }>(
    `SELECT id::text AS id
     FROM contact_related_companies
     WHERE contact_id = $1 AND company_id = $2`,
    [contactId, companyId],
  );
  if (rows.length > 0) {
    throw new Error("Remove the related-company relationship before making this the primary company.");
  }
}

export async function contactIsEligiblePrimeContact(
  contactId: number,
  companyId: number,
): Promise<boolean> {
  const rows = await query<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM contacts c
       WHERE c.id = $1
         AND (
           c.company_id = $2
           OR EXISTS (
             SELECT 1
             FROM relationships r
             WHERE r.status = 'Active'
               AND (
                 (
                   r.from_entity_type = 'company'
                   AND r.to_entity_type = 'contact'
                   AND r.to_entity_id = c.id::text
                   AND (
                     r.from_entity_id = $2::text
                     OR r.from_entity_id = (SELECT business_id FROM companies WHERE id = $2)
                   )
                 )
                 OR (
                   r.from_entity_type = 'contact'
                   AND r.to_entity_type = 'company'
                   AND r.from_entity_id = c.id::text
                   AND (
                     r.to_entity_id = $2::text
                     OR r.to_entity_id = (SELECT business_id FROM companies WHERE id = $2)
                   )
                 )
               )
           )
         )
     ) AS ok`,
    [contactId, companyId],
  );
  const value = rows[0]?.ok as unknown;
  return value === true || value === "t" || value === "true";
}

export async function listContactRelatedCompanies(contactId: number): Promise<ContactRelatedCompany[]> {
  const rows = await query<ContactRelatedCompany>(
    `SELECT r.id, r.contact_id, r.company_id, r.relationship_role, r.notes,
            r.created_at::text AS created_at, r.updated_at::text AS updated_at,
            c.company_name,
            COALESCE(cv.business_id, c.business_id) AS company_business_id
     FROM contact_related_companies r
     JOIN companies c ON c.id = r.company_id
     LEFT JOIN companies_v1 cv ON cv.legacy_company_id = c.id
     WHERE r.contact_id = $1
     ORDER BY c.company_name ASC, r.id ASC`,
    [contactId],
  );
  return rows.map((row) => ({
    ...row,
    id: Number(row.id),
    contact_id: Number(row.contact_id),
    company_id: Number(row.company_id),
  }));
}

export async function listCompanyRelatedContacts(companyId: number): Promise<CompanyRelatedContact[]> {
  const rows = await query<CompanyRelatedContact>(
    `SELECT r.id,
            r.contact_id,
            ${sqlContactDisplayName("c")} AS contact_name,
            COALESCE(c.business_id, cm.business_id) AS contact_business_id,
            c.company_id AS primary_company_id,
            co.company_name AS primary_company_name,
            COALESCE(cv.business_id, co.business_id) AS primary_company_business_id,
            r.relationship_role,
            r.notes
     FROM contact_related_companies r
     JOIN contacts c ON c.id = r.contact_id
     LEFT JOIN contacts_v1 cm ON cm.legacy_contact_id = c.id
     LEFT JOIN companies co ON co.id = c.company_id
     LEFT JOIN companies_v1 cv ON cv.legacy_company_id = co.id
     WHERE r.company_id = $1
       AND ${sqlContactListVisible("c")}
     ORDER BY ${sqlContactDisplayName("c")} ASC, r.id ASC`,
    [companyId],
  );
  return rows.map((row) => ({
    ...row,
    id: Number(row.id),
    contact_id: Number(row.contact_id),
    primary_company_id: row.primary_company_id == null ? null : Number(row.primary_company_id),
  }));
}

/** Link an existing contact to another company without copying the contact or changing their primary company. */
export async function addExistingContactToCompany(contactId: number, companyId: number): Promise<number> {
  await assertNotPrimaryCompany(contactId, companyId);
  const rows = await query<{ id: string }>(
    `INSERT INTO contact_related_companies (contact_id, company_id, relationship_role)
     VALUES ($1, $2, 'added')
     ON CONFLICT (contact_id, company_id) DO UPDATE SET updated_at = NOW()
     RETURNING id::text AS id`,
    [contactId, companyId],
  );
  return Number.parseInt(rows[0]!.id, 10);
}

export async function addContactRelatedCompany(
  contactId: number,
  companyId: number,
  role: string,
  notes?: string | null,
): Promise<number> {
  const relationshipRole = normalizeRole(role);
  await assertNotPrimaryCompany(contactId, companyId);
  const rows = await query<{ id: string }>(
    `INSERT INTO contact_related_companies (contact_id, company_id, relationship_role, notes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (contact_id, company_id) DO UPDATE SET
       relationship_role = EXCLUDED.relationship_role,
       notes = EXCLUDED.notes,
       updated_at = NOW()
     RETURNING id::text AS id`,
    [contactId, companyId, relationshipRole, notes?.trim() || null],
  );
  return Number.parseInt(rows[0]!.id, 10);
}

export async function updateContactRelatedCompany(
  contactId: number,
  relationshipId: number,
  role: string,
  notes?: string | null,
): Promise<void> {
  const relationshipRole = normalizeRole(role);
  const rows = await query<{ id: string }>(
    `UPDATE contact_related_companies
     SET relationship_role = $3, notes = $4, updated_at = NOW()
     WHERE id = $1 AND contact_id = $2
     RETURNING id::text AS id`,
    [relationshipId, contactId, relationshipRole, notes?.trim() || null],
  );
  if (!rows[0]) throw new Error("Related company not found");
}

export async function removeContactRelatedCompany(contactId: number, relationshipId: number): Promise<void> {
  await query(`DELETE FROM contact_related_companies WHERE id = $1 AND contact_id = $2`, [
    relationshipId,
    contactId,
  ]);
}
