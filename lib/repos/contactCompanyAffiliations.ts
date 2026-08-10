import { query } from "@/lib/db";

export type ContactCompanyAffiliation = {
  id: number;
  contact_id: number;
  company_id: number;
  job_title: string | null;
  role: string | null;
  is_primary: boolean;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  company_name: string | null;
  company_business_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ContactCompanyAffiliationInput = {
  company_id: number;
  job_title?: string | null;
  role?: string | null;
  is_primary?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
};

async function syncPrimaryCompanyFk(contactId: number): Promise<void> {
  const rows = await query<{ company_id: number }>(
    `SELECT company_id FROM contact_company_affiliations
     WHERE contact_id = $1 AND is_primary = TRUE
     ORDER BY id ASC
     LIMIT 1`,
    [contactId],
  );
  const primaryId = rows[0]?.company_id ?? null;
  if (primaryId == null) {
    const fallback = await query<{ company_id: number }>(
      `SELECT company_id FROM contact_company_affiliations
       WHERE contact_id = $1
       ORDER BY id ASC
       LIMIT 1`,
      [contactId],
    );
    await query(`UPDATE contacts SET company_id = $2 WHERE id = $1`, [
      contactId,
      fallback[0]?.company_id ?? null,
    ]);
    return;
  }
  await query(`UPDATE contacts SET company_id = $2 WHERE id = $1`, [contactId, primaryId]);
}

async function clearPrimaryForContact(contactId: number, exceptId?: number): Promise<void> {
  if (exceptId != null) {
    await query(
      `UPDATE contact_company_affiliations SET is_primary = FALSE
       WHERE contact_id = $1 AND id <> $2`,
      [contactId, exceptId],
    );
  } else {
    await query(
      `UPDATE contact_company_affiliations SET is_primary = FALSE WHERE contact_id = $1`,
      [contactId],
    );
  }
}

export async function listContactCompanyAffiliations(
  contactId: number,
): Promise<ContactCompanyAffiliation[]> {
  return query<ContactCompanyAffiliation>(
    `SELECT a.id, a.contact_id, a.company_id, a.job_title, a.role, a.is_primary,
            a.start_date::text AS start_date, a.end_date::text AS end_date, a.notes,
            a.created_at::text AS created_at, a.updated_at::text AS updated_at,
            c.company_name,
            COALESCE(cv.business_id, c.business_id) AS company_business_id
     FROM contact_company_affiliations a
     JOIN companies c ON c.id = a.company_id
     LEFT JOIN companies_v1 cv ON cv.legacy_company_id = c.id
     WHERE a.contact_id = $1
     ORDER BY a.is_primary DESC, c.company_name ASC, a.id ASC`,
    [contactId],
  );
}

function isMissingAffiliationsTable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    /contact_company_affiliations/i.test(err.message) &&
    /does not exist|undefined table/i.test(err.message)
  );
}

/** Best-effort sync; contacts.company_id remains the fallback when the table is absent. */
export async function syncContactPrimaryAffiliation(
  contactId: number,
  input: ContactCompanyAffiliationInput,
): Promise<void> {
  try {
    await addContactCompanyAffiliation(contactId, input);
  } catch (err) {
    if (!isMissingAffiliationsTable(err)) throw err;
  }
}

export async function addContactCompanyAffiliation(
  contactId: number,
  input: ContactCompanyAffiliationInput,
): Promise<number> {
  const existing = await listContactCompanyAffiliations(contactId);
  const makePrimary = input.is_primary === true || existing.length === 0;
  if (makePrimary) await clearPrimaryForContact(contactId);

  const rows = await query<{ id: string }>(
    `INSERT INTO contact_company_affiliations (
       contact_id, company_id, job_title, role, is_primary, start_date, end_date, notes
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (contact_id, company_id) DO UPDATE SET
       job_title = COALESCE(EXCLUDED.job_title, contact_company_affiliations.job_title),
       role = COALESCE(EXCLUDED.role, contact_company_affiliations.role),
       is_primary = EXCLUDED.is_primary OR contact_company_affiliations.is_primary,
       start_date = COALESCE(EXCLUDED.start_date, contact_company_affiliations.start_date),
       end_date = COALESCE(EXCLUDED.end_date, contact_company_affiliations.end_date),
       notes = COALESCE(EXCLUDED.notes, contact_company_affiliations.notes),
       updated_at = NOW()
     RETURNING id::text AS id`,
    [
      contactId,
      input.company_id,
      input.job_title?.trim() || null,
      input.role?.trim() || null,
      makePrimary,
      input.start_date?.trim() || null,
      input.end_date?.trim() || null,
      input.notes?.trim() || null,
    ],
  );
  const id = Number.parseInt(rows[0]!.id, 10);
  if (makePrimary) await clearPrimaryForContact(contactId, id);
  await syncPrimaryCompanyFk(contactId);
  return id;
}

export async function updateContactCompanyAffiliation(
  affiliationId: number,
  input: Partial<ContactCompanyAffiliationInput> & { contact_id: number },
): Promise<void> {
  const contactId = input.contact_id;
  if (input.is_primary) await clearPrimaryForContact(contactId, affiliationId);

  await query(
    `UPDATE contact_company_affiliations SET
       job_title = COALESCE($3, job_title),
       role = COALESCE($4, role),
       is_primary = COALESCE($5, is_primary),
       start_date = COALESCE($6, start_date),
       end_date = COALESCE($7, end_date),
       notes = COALESCE($8, notes),
       updated_at = NOW()
     WHERE id = $1 AND contact_id = $2`,
    [
      affiliationId,
      contactId,
      input.job_title === undefined ? null : input.job_title?.trim() || null,
      input.role === undefined ? null : input.role?.trim() || null,
      input.is_primary ?? null,
      input.start_date === undefined ? null : input.start_date?.trim() || null,
      input.end_date === undefined ? null : input.end_date?.trim() || null,
      input.notes === undefined ? null : input.notes?.trim() || null,
    ],
  );
  await syncPrimaryCompanyFk(contactId);
}

export async function setPrimaryContactCompanyAffiliation(
  contactId: number,
  affiliationId: number,
): Promise<void> {
  await clearPrimaryForContact(contactId);
  await query(
    `UPDATE contact_company_affiliations SET is_primary = TRUE, updated_at = NOW()
     WHERE id = $1 AND contact_id = $2`,
    [affiliationId, contactId],
  );
  await syncPrimaryCompanyFk(contactId);
}

export async function removeContactCompanyAffiliation(
  contactId: number,
  affiliationId: number,
): Promise<void> {
  await query(`DELETE FROM contact_company_affiliations WHERE id = $1 AND contact_id = $2`, [
    affiliationId,
    contactId,
  ]);
  const remaining = await listContactCompanyAffiliations(contactId);
  if (remaining.length > 0 && !remaining.some((r) => r.is_primary)) {
    await setPrimaryContactCompanyAffiliation(contactId, remaining[0]!.id);
  } else {
    await syncPrimaryCompanyFk(contactId);
  }
}
