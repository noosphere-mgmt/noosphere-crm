-- Phase 36: Contact ↔ Company affiliations (many companies per contact)
-- Keeps contacts.company_id as denormalized primary for backwards compatibility.

BEGIN;

ALTER TABLE contacts
  ALTER COLUMN company_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS contact_company_affiliations (
  id            BIGSERIAL PRIMARY KEY,
  contact_id    BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  company_id    BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_title     TEXT NULL,
  role          TEXT NULL,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  start_date    DATE NULL,
  end_date      DATE NULL,
  notes         TEXT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contact_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_company_affiliations_contact
  ON contact_company_affiliations(contact_id);

CREATE INDEX IF NOT EXISTS idx_contact_company_affiliations_company
  ON contact_company_affiliations(company_id);

-- Backfill missing affiliation rows from the denormalized company FK.
-- Do not force is_primary here: a contact may already have a primary affiliation
-- with a different company, and the unique partial index forbids two primaries.
INSERT INTO contact_company_affiliations (contact_id, company_id, job_title, is_primary)
SELECT c.id, c.company_id, c.title, FALSE
FROM contacts c
WHERE c.company_id IS NOT NULL
ON CONFLICT (contact_id, company_id) DO NOTHING;

-- BEGIN normalize-contact-affiliation-primary
-- One primary affiliation per contact. Preserve every affiliation row.
--
-- Winner for contacts that currently have more than one is_primary = TRUE:
--   1. Affiliation whose company_id = contacts.company_id (canonical company FK)
--   2. Else an existing primary row that is current (end_date IS NULL OR end_date >= today)
--   3. Else the existing primary with the lowest id
--      (same ORDER BY id ASC LIMIT 1 used by syncPrimaryCompanyFk)
-- All other affiliations for that contact are set is_primary = FALSE.
WITH winners AS (
  SELECT DISTINCT ON (a.contact_id)
         a.id AS winner_id,
         a.contact_id
    FROM contact_company_affiliations a
    JOIN contacts c ON c.id = a.contact_id
   WHERE a.contact_id IN (
           SELECT contact_id
             FROM contact_company_affiliations
            WHERE is_primary = TRUE
            GROUP BY contact_id
           HAVING COUNT(*) > 1
         )
   ORDER BY a.contact_id,
            CASE WHEN c.company_id IS NOT NULL AND a.company_id = c.company_id THEN 0 ELSE 1 END,
            CASE WHEN a.is_primary THEN 0 ELSE 1 END,
            CASE
              WHEN a.end_date IS NULL OR a.end_date >= CURRENT_DATE THEN 0
              ELSE 1
            END,
            a.id ASC
),
demoted AS (
  UPDATE contact_company_affiliations a
     SET is_primary = FALSE, updated_at = NOW()
    FROM winners w
   WHERE a.contact_id = w.contact_id
     AND a.is_primary = TRUE
     AND a.id <> w.winner_id
   RETURNING a.id
)
UPDATE contact_company_affiliations a
   SET is_primary = TRUE, updated_at = NOW()
  FROM winners w
 WHERE a.id = w.winner_id
   AND a.is_primary = FALSE;
-- END normalize-contact-affiliation-primary

-- Fresh backfill: if the contact has no primary yet, the canonical company row is primary.
UPDATE contact_company_affiliations a
   SET is_primary = TRUE, updated_at = NOW()
  FROM contacts c
 WHERE a.contact_id = c.id
   AND c.company_id IS NOT NULL
   AND a.company_id = c.company_id
   AND a.is_primary = FALSE
   AND NOT EXISTS (
         SELECT 1
           FROM contact_company_affiliations x
          WHERE x.contact_id = a.contact_id
            AND x.is_primary = TRUE
       );

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_company_affiliations_one_primary
  ON contact_company_affiliations(contact_id)
  WHERE is_primary = TRUE;

COMMIT;
