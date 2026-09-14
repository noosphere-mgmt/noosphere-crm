-- =============================================================================
-- DISCOVERY ONLY — Beijing Heshuntai Cloud / AI Data Center opportunity
-- =============================================================================
-- Safe to run on production PostgreSQL as a read-only session.
-- This file contains SELECT / SHOW / SET (read-only) only.
-- It does not INSERT, UPDATE, DELETE, CREATE, DROP, TRUNCATE, or ALTER.
--
-- Do not assume any local database contains this record.
-- Do not paste restoration ideas into this session.
--
-- How to run:
--   psql "$NOOSPHERE_DATABASE_URL" -v ON_ERROR_STOP=1 \
--     -f scripts/recovery/heshuntai-opportunity-discovery.sql
--
-- If a later query fails with "relation does not exist", skip that section
-- (production may be behind a migrate phase) and continue.
-- =============================================================================

SET default_transaction_read_only = on;
SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;
BEGIN READ ONLY;

-- -----------------------------------------------------------------------------
-- 0) Session + schema facts (delete semantics on THIS database)
-- -----------------------------------------------------------------------------

SELECT
  current_database() AS database,
  current_user AS db_user,
  inet_server_addr() AS server_addr,
  inet_server_port() AS server_port,
  current_setting('transaction_read_only') AS transaction_read_only,
  now() AS started_at;

SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  a.attname AS column_name,
  pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND c.relkind = 'r'
  AND a.attnum > 0
  AND NOT a.attisdropped
  AND (
    a.attname ILIKE '%opportunit%'
    OR a.attname ILIKE '%deleted%'
    OR a.attname IN ('is_active', 'archived', 'archived_at', 'deleted_at')
  )
ORDER BY 1, 2, 3;

-- Foreign keys that REFERENCE opportunities (what delete does to children)
SELECT
  con.conname AS constraint_name,
  n.nspname AS child_schema,
  rel.relname AS child_table,
  pg_get_constraintdef(con.oid) AS definition,
  CASE con.confdeltype
    WHEN 'c' THEN 'CASCADE — child rows are removed with the opportunity'
    WHEN 'n' THEN 'SET NULL — child row kept; opportunity_id cleared'
    WHEN 'd' THEN 'SET DEFAULT'
    WHEN 'r' THEN 'RESTRICT — delete would fail if children exist'
    WHEN 'a' THEN 'NO ACTION'
    ELSE con.confdeltype::text
  END AS on_delete
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace n ON n.oid = rel.relnamespace
JOIN pg_class ref ON ref.oid = con.confrelid
WHERE con.contype = 'f'
  AND ref.relname = 'opportunities'
ORDER BY
  CASE con.confdeltype WHEN 'c' THEN 1 WHEN 'n' THEN 2 ELSE 3 END,
  rel.relname;

-- Triggers on opportunities (expect updated_at only; no audit/soft-delete trigger)
SELECT tg.tgname, pg_get_triggerdef(tg.oid) AS definition
FROM pg_trigger tg
JOIN pg_class c ON c.oid = tg.tgrelid
WHERE c.relname = 'opportunities'
  AND NOT tg.tgisinternal
ORDER BY 1;

-- Opportunities themselves: confirm there is no soft-delete column
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = current_schema()
  AND table_name = 'opportunities'
ORDER BY ordinal_position;

-- -----------------------------------------------------------------------------
-- 1) Identify the company (legacy companies + companies_v1)
--    Strict tokens first; broader "AI Data Center" is a second net.
-- -----------------------------------------------------------------------------

WITH needles_strict AS (
  SELECT term FROM (VALUES
    ('heshuntai'),
    ('heshun tai'),
    ('he shun tai'),
    ('heshuntai cloud'),
    ('beijing heshuntai'),
    ('和顺泰'),
    ('合顺泰')
  ) AS t(term)
)
SELECT
  'companies' AS source_table,
  c.id::text AS company_pk,
  c.business_id,
  c.is_active,
  c.company_name,
  c.company_name_zh,
  c.company_name_cn,
  c.industry,
  c.notes,
  c.created_at::text,
  c.updated_at::text
FROM companies c
WHERE EXISTS (
  SELECT 1 FROM needles_strict n
  WHERE concat_ws(' ',
          c.company_name,
          c.company_name_zh,
          c.company_name_cn,
          c.notes,
          c.industry
        ) ILIKE '%' || n.term || '%'
)
ORDER BY c.is_active DESC, c.id;

WITH needles_strict AS (
  SELECT term FROM (VALUES
    ('heshuntai'),
    ('heshun tai'),
    ('he shun tai'),
    ('heshuntai cloud'),
    ('beijing heshuntai'),
    ('和顺泰'),
    ('合顺泰')
  ) AS t(term)
)
SELECT
  'companies_v1' AS source_table,
  v.company_id,
  v.business_id,
  v.legacy_company_id::text,
  v.company_status,
  v.company_name_en,
  v.company_name_zh,
  v.company_type,
  v.industry,
  v.company_remarks,
  v.created_at::text,
  v.updated_at::text
FROM companies_v1 v
WHERE EXISTS (
  SELECT 1 FROM needles_strict n
  WHERE concat_ws(' ',
          v.company_name_en,
          v.company_name_zh,
          v.company_remarks,
          v.industry,
          v.company_id
        ) ILIKE '%' || n.term || '%'
)
ORDER BY v.company_id;

-- Broader company net (may include unrelated AI / data-centre names)
WITH needles_broad AS (
  SELECT term FROM (VALUES
    ('ai data center'),
    ('ai data centre'),
    ('data center'),
    ('data centre'),
    ('数据中心')
  ) AS t(term)
)
SELECT
  'companies_broad' AS source_table,
  c.id::text AS company_pk,
  c.business_id,
  c.is_active,
  c.company_name,
  c.company_name_zh,
  c.company_name_cn
FROM companies c
WHERE EXISTS (
  SELECT 1 FROM needles_broad n
  WHERE concat_ws(' ', c.company_name, c.company_name_zh, c.company_name_cn)
        ILIKE '%' || n.term || '%'
)
ORDER BY c.id;

-- Contacts of any matched company (active + soft-deleted contacts)
WITH needles_strict AS (
  SELECT term FROM (VALUES
    ('heshuntai'),
    ('heshun tai'),
    ('beijing heshuntai'),
    ('和顺泰'),
    ('合顺泰')
  ) AS t(term)
),
matched_companies AS (
  SELECT c.id
  FROM companies c
  WHERE EXISTS (
    SELECT 1 FROM needles_strict n
    WHERE concat_ws(' ', c.company_name, c.company_name_zh, c.company_name_cn, c.notes)
          ILIKE '%' || n.term || '%'
  )
)
SELECT
  ct.id AS contact_id,
  ct.business_id AS contact_business_id,
  ct.company_id,
  ct.is_active,
  ct.contact_name,
  ct.chinese_name,
  ct.email,
  ct.phone,
  ct.title,
  ct.notes
FROM contacts ct
WHERE ct.company_id IN (SELECT id FROM matched_companies)
   OR EXISTS (
     SELECT 1 FROM needles_strict n
     WHERE concat_ws(' ', ct.contact_name, ct.chinese_name, ct.notes, ct.email)
           ILIKE '%' || n.term || '%'
   )
ORDER BY ct.is_active DESC, ct.id;

-- -----------------------------------------------------------------------------
-- 2) Search opportunities: live rows (there is no archived / soft-deleted table)
--    Include every status, including closed_won / closed_lost.
-- -----------------------------------------------------------------------------

WITH needles AS (
  SELECT term FROM (VALUES
    ('heshuntai'),
    ('heshun tai'),
    ('beijing heshuntai'),
    ('heshuntai cloud'),
    ('ai data center'),
    ('ai data centre'),
    ('和顺泰'),
    ('合顺泰')
  ) AS t(term)
),
matched_companies AS (
  SELECT c.id
  FROM companies c
  WHERE EXISTS (
    SELECT 1 FROM needles n
    WHERE concat_ws(' ', c.company_name, c.company_name_zh, c.company_name_cn, c.notes)
          ILIKE '%' || n.term || '%'
  )
)
SELECT o.*
FROM opportunities o
WHERE o.company_id IN (SELECT id FROM matched_companies)
   OR o.referrer_company_id IN (SELECT id FROM matched_companies)
   OR EXISTS (
     SELECT 1 FROM needles n
     WHERE concat_ws(' ',
             o.client_name,
             o.company_name,
             o.requirement_summary,
             o.remarks,
             o.district_preference,
             o.waiting_for,
             o.next_action
           ) ILIKE '%' || n.term || '%'
   )
ORDER BY o.id;

-- Parallel v1 sidecar (legacy OPP- ids). Not used by current UI, but may retain a copy.
WITH needles AS (
  SELECT term FROM (VALUES
    ('heshuntai'),
    ('heshun tai'),
    ('beijing heshuntai'),
    ('ai data center'),
    ('ai data centre'),
    ('和顺泰'),
    ('合顺泰')
  ) AS t(term)
)
SELECT
  v.opportunity_id,
  v.business_id,
  v.legacy_opportunity_id,
  v.pipeline_status,
  v.client_company_id,
  v.requirement_summary,
  v.remarks,
  v.lost_reason,
  v.created_at::text
FROM opportunities_v1 v
WHERE EXISTS (
  SELECT 1 FROM needles n
  WHERE concat_ws(' ',
          v.opportunity_id,
          v.requirement_summary,
          v.remarks,
          v.lost_reason,
          v.client_company_id,
          v.target_districts
        ) ILIKE '%' || n.term || '%'
)
   OR v.legacy_opportunity_id IN (
     SELECT o.id FROM opportunities o
     WHERE o.company_id IN (
       SELECT c.id FROM companies c
       WHERE concat_ws(' ', c.company_name, c.company_name_zh, c.company_name_cn)
             ILIKE '%heshuntai%'
          OR concat_ws(' ', c.company_name, c.company_name_zh, c.company_name_cn)
             ILIKE '%和顺泰%'
     )
   )
ORDER BY v.opportunity_id;

-- -----------------------------------------------------------------------------
-- 3) Identity leftovers (no FK to opportunities — survive a hard delete)
-- -----------------------------------------------------------------------------

SELECT
  x.entity_type,
  x.business_id,
  x.primary_ref,
  x.deprecated_ref,
  x.legacy_numeric,
  x.created_at::text,
  EXISTS (
    SELECT 1 FROM opportunities o
    WHERE o.id::text = x.primary_ref
       OR o.business_id = x.business_id
       OR o.id = x.legacy_numeric
  ) AS opportunity_row_still_exists
FROM business_id_crosswalk x
WHERE x.entity_type = 'opportunity'
  AND (
    x.business_id ILIKE '%heshuntai%'
    OR x.primary_ref ILIKE '%heshuntai%'
    OR x.deprecated_ref ILIKE '%heshuntai%'
    OR NOT EXISTS (
      SELECT 1 FROM opportunities o
      WHERE o.id::text = x.primary_ref
         OR o.business_id = x.business_id
         OR o.id = x.legacy_numeric
    )
  )
ORDER BY x.created_at DESC
LIMIT 200;

-- Crosswalk rows whose numeric opportunity no longer exists
SELECT
  x.business_id,
  x.primary_ref,
  x.legacy_numeric,
  x.created_at::text
FROM business_id_crosswalk x
WHERE x.entity_type = 'opportunity'
  AND NOT EXISTS (
    SELECT 1 FROM opportunities o
    WHERE o.id = x.legacy_numeric
       OR o.id::text = x.primary_ref
       OR o.business_id = x.business_id
  )
ORDER BY x.legacy_numeric NULLS LAST, x.business_id;

SELECT
  m.entity_type,
  m.legacy_id,
  m.new_id,
  m.created_at::text,
  EXISTS (SELECT 1 FROM opportunities o WHERE o.id = m.legacy_id) AS opportunity_row_still_exists
FROM id_map_v1 m
WHERE m.entity_type ILIKE '%opportunit%'
ORDER BY m.legacy_id;

-- -----------------------------------------------------------------------------
-- 4) Child / related tables that CASCADE (should be empty after a hard delete)
--    If rows remain, the FK is missing or the opportunity still exists.
-- -----------------------------------------------------------------------------

WITH needles AS (
  SELECT term FROM (VALUES
    ('heshuntai'),
    ('heshun tai'),
    ('beijing heshuntai'),
    ('ai data center'),
    ('ai data centre'),
    ('和顺泰'),
    ('合顺泰')
  ) AS t(term)
),
matched_companies AS (
  SELECT c.id FROM companies c
  WHERE EXISTS (
    SELECT 1 FROM needles n
    WHERE concat_ws(' ', c.company_name, c.company_name_zh, c.company_name_cn, c.notes)
          ILIKE '%' || n.term || '%'
  )
)
SELECT
  'opportunity_parties' AS src,
  op.id,
  op.opportunity_id,
  op.company_id,
  op.contact_id,
  op.role,
  op.fee_note,
  op.collect_fee_amount,
  op.paid_out_fee_amount,
  op.collect_fee_status,
  op.remarks,
  EXISTS (SELECT 1 FROM opportunities o WHERE o.id = op.opportunity_id) AS parent_exists
FROM opportunity_parties op
WHERE op.company_id IN (SELECT id FROM matched_companies)
   OR op.opportunity_id IN (SELECT o.id FROM opportunities o WHERE o.company_id IN (SELECT id FROM matched_companies))
   OR EXISTS (
     SELECT 1 FROM needles n
     WHERE concat_ws(' ', op.role, op.fee_note, op.remarks) ILIKE '%' || n.term || '%'
   )
ORDER BY op.id;

WITH needles AS (
  SELECT term FROM (VALUES
    ('heshuntai'),
    ('ai data center'),
    ('ai data centre'),
    ('和顺泰')
  ) AS t(term)
),
matched_companies AS (
  SELECT c.id FROM companies c
  WHERE EXISTS (
    SELECT 1 FROM needles n
    WHERE concat_ws(' ', c.company_name, c.company_name_zh, c.company_name_cn)
          ILIKE '%' || n.term || '%'
  )
)
SELECT
  'opportunity_proposed_premises' AS src,
  pp.id,
  pp.opportunity_id,
  pp.premises_id,
  pp.status,
  pp.client_comment,
  pp.advisor_comment,
  pp.remarks,
  pp.related_company_id,
  EXISTS (SELECT 1 FROM opportunities o WHERE o.id = pp.opportunity_id) AS parent_exists
FROM opportunity_proposed_premises pp
WHERE pp.related_company_id IN (SELECT id FROM matched_companies)
   OR pp.collect_fee_from_company_id IN (SELECT id FROM matched_companies)
   OR pp.paid_out_to_company_id IN (SELECT id FROM matched_companies)
   OR EXISTS (
     SELECT 1 FROM needles n
     WHERE concat_ws(' ', pp.client_comment, pp.advisor_comment, pp.remarks, pp.fee_remarks)
           ILIKE '%' || n.term || '%'
   )
ORDER BY pp.id;

SELECT
  'opportunity_documents' AS src,
  d.id,
  d.opportunity_id,
  d.title,
  d.category,
  d.original_name,
  d.stored_file,
  d.notes,
  d.created_at::text,
  EXISTS (SELECT 1 FROM opportunities o WHERE o.id = d.opportunity_id) AS parent_exists
FROM opportunity_documents d
WHERE d.title ILIKE '%heshuntai%'
   OR d.original_name ILIKE '%heshuntai%'
   OR d.notes ILIKE '%heshuntai%'
   OR d.title ILIKE '%和顺泰%'
   OR d.original_name ILIKE '%data center%'
   OR d.original_name ILIKE '%data centre%'
ORDER BY d.id;

SELECT
  'opportunity_proposals' AS src,
  p.id,
  p.opportunity_id,
  p.title,
  p.status,
  p.output_file,
  p.prepared_for_company_id,
  EXISTS (SELECT 1 FROM opportunities o WHERE o.id = p.opportunity_id) AS parent_exists
FROM opportunity_proposals p
WHERE p.title ILIKE '%heshuntai%'
   OR p.title ILIKE '%和顺泰%'
   OR p.title ILIKE '%data center%'
   OR p.title ILIKE '%data centre%'
   OR p.prepared_for_company_id IN (
     SELECT c.id FROM companies c
     WHERE concat_ws(' ', c.company_name, c.company_name_zh, c.company_name_cn)
           ILIKE '%heshuntai%'
        OR concat_ws(' ', c.company_name, c.company_name_zh, c.company_name_cn)
           ILIKE '%和顺泰%'
   )
ORDER BY p.id;

SELECT
  'opportunity_commissions' AS src,
  oc.opportunity_id,
  oc.fee_from_seller,
  oc.fee_from_buyer,
  oc.fee_from_operator_landlord,
  oc.fee_from_tenant,
  oc.payout_amount,
  oc.payout_company_id,
  oc.remarks,
  EXISTS (SELECT 1 FROM opportunities o WHERE o.id = oc.opportunity_id) AS parent_exists
FROM opportunity_commissions oc
WHERE oc.payout_company_id IN (
        SELECT c.id FROM companies c
        WHERE concat_ws(' ', c.company_name, c.company_name_zh, c.company_name_cn)
              ILIKE '%heshuntai%'
           OR concat_ws(' ', c.company_name, c.company_name_zh, c.company_name_cn)
              ILIKE '%和顺泰%'
      )
   OR oc.remarks ILIKE '%heshuntai%'
   OR oc.remarks ILIKE '%和顺泰%'
   OR oc.remarks ILIKE '%data center%'
ORDER BY oc.opportunity_id;

-- -----------------------------------------------------------------------------
-- 5) SET NULL survivors (row kept; opportunity_id cleared)
--    These are the most likely DB remnants after a hard delete.
-- -----------------------------------------------------------------------------

WITH needles AS (
  SELECT term FROM (VALUES
    ('heshuntai'),
    ('heshun tai'),
    ('beijing heshuntai'),
    ('heshuntai cloud'),
    ('ai data center'),
    ('ai data centre'),
    ('和顺泰'),
    ('合顺泰')
  ) AS t(term)
),
matched_companies AS (
  SELECT c.id FROM companies c
  WHERE EXISTS (
    SELECT 1 FROM needles n
    WHERE concat_ws(' ', c.company_name, c.company_name_zh, c.company_name_cn, c.notes)
          ILIKE '%' || n.term || '%'
  )
),
matched_contacts AS (
  SELECT ct.id FROM contacts ct
  WHERE ct.company_id IN (SELECT id FROM matched_companies)
)
SELECT
  a.id,
  a.activity_id,
  a.business_id,
  a.activity_date::text,
  a.activity_type,
  a.subject,
  a.notes,
  a.company_id,
  a.contact_id,
  a.opportunity_id,
  a.premises_id,
  a.owner,
  EXISTS (SELECT 1 FROM opportunities o WHERE o.id = a.opportunity_id) AS opportunity_parent_exists
FROM activities a
WHERE a.company_id IN (SELECT id FROM matched_companies)
   OR a.contact_id IN (SELECT id FROM matched_contacts)
   OR EXISTS (
     SELECT 1 FROM needles n
     WHERE concat_ws(' ', a.subject, a.notes, a.owner, a.activity_type)
           ILIKE '%' || n.term || '%'
   )
   OR (
     a.opportunity_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM opportunities o WHERE o.id = a.opportunity_id)
   )
ORDER BY a.activity_date DESC NULLS LAST, a.id DESC;

-- Orphan activity FKs (should be zero if the SET NULL FK is present)
SELECT a.id, a.activity_id, a.opportunity_id, a.subject
FROM activities a
WHERE a.opportunity_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM opportunities o WHERE o.id = a.opportunity_id);

SELECT
  l.id,
  l.status,
  l.company_name,
  l.contact_name,
  l.email_subject,
  l.requirement_notes,
  l.ai_digest,
  l.converted_company_id,
  l.converted_contact_id,
  l.converted_opportunity_id,
  l.converted_at::text,
  l.created_at::text
FROM leads l
WHERE l.converted_company_id IN (
        SELECT c.id FROM companies c
        WHERE concat_ws(' ', c.company_name, c.company_name_zh, c.company_name_cn)
              ILIKE '%heshuntai%'
           OR concat_ws(' ', c.company_name, c.company_name_zh, c.company_name_cn)
              ILIKE '%和顺泰%'
      )
   OR concat_ws(' ', l.company_name, l.contact_name, l.email_subject, l.requirement_notes, l.ai_digest)
      ILIKE '%heshuntai%'
   OR concat_ws(' ', l.company_name, l.email_subject, l.requirement_notes)
      ILIKE '%和顺泰%'
   OR concat_ws(' ', l.company_name, l.email_subject, l.requirement_notes)
      ILIKE '%data center%'
   OR (
     l.converted_opportunity_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM opportunities o WHERE o.id = l.converted_opportunity_id)
   )
ORDER BY l.id;

-- -----------------------------------------------------------------------------
-- 6) Relationships, import history, free-text notes
-- -----------------------------------------------------------------------------

SELECT
  r.relationship_id,
  r.from_entity_type,
  r.from_entity_id,
  r.to_entity_type,
  r.to_entity_id,
  r.relationship_type,
  r.status,
  r.remarks
FROM relationships r
WHERE r.from_entity_type ILIKE '%opportunit%'
   OR r.to_entity_type ILIKE '%opportunit%'
   OR concat_ws(' ', r.relationship_type, r.remarks, r.from_entity_id, r.to_entity_id)
      ILIKE '%heshuntai%'
   OR concat_ws(' ', r.relationship_type, r.remarks)
      ILIKE '%和顺泰%'
ORDER BY r.created_at DESC NULLS LAST;

SELECT
  ir.id AS import_run_id,
  ir.object_type,
  ir.filename,
  ir.uploaded_by,
  ir.import_date::text,
  ir.created_count,
  ir.updated_count,
  ir.cleared_count,
  ir.error_count
FROM import_runs ir
WHERE ir.object_type ILIKE '%opportunit%'
   OR ir.filename ILIKE '%heshuntai%'
   OR ir.filename ILIKE '%opportunity%'
ORDER BY ir.import_date DESC
LIMIT 100;

SELECT
  irr.id,
  irr.import_run_id,
  irr.row_number,
  irr.action,
  irr.matched_id,
  irr.candidate_ids,
  irr.error_message,
  irr.raw_row
FROM import_run_rows irr
WHERE irr.raw_row::text ILIKE '%heshuntai%'
   OR irr.raw_row::text ILIKE '%和顺泰%'
   OR irr.raw_row::text ILIKE '%Heshuntai%'
   OR irr.field_changes::text ILIKE '%heshuntai%'
   OR irr.error_message ILIKE '%heshuntai%'
ORDER BY irr.import_run_id DESC, irr.row_number
LIMIT 200;

SELECT
  s.id,
  s.object_type,
  s.filename,
  s.status,
  s.created_at::text
FROM import_sessions s
WHERE s.parsed_rows::text ILIKE '%heshuntai%'
   OR s.preview_rows::text ILIKE '%heshuntai%'
   OR s.parsed_rows::text ILIKE '%和顺泰%'
   OR s.filename ILIKE '%heshuntai%'
ORDER BY s.created_at DESC
LIMIT 50;

-- Company / contact notes that may describe the deal after the opportunity is gone
SELECT
  'companies.notes' AS src,
  c.id,
  c.business_id,
  c.company_name,
  c.notes
FROM companies c
WHERE c.notes ILIKE '%heshuntai%'
   OR c.notes ILIKE '%和顺泰%'
   OR c.notes ILIKE '%data center%'
   OR c.notes ILIKE '%data centre%';

-- -----------------------------------------------------------------------------
-- 7) Inventory of every column named *opportunit* and leftover numeric ids
-- -----------------------------------------------------------------------------

-- Rows in SET NULL / leftover columns whose opportunity parent is missing
SELECT
  'activities.opportunity_id orphan' AS kind,
  count(*)::bigint AS n
FROM activities a
WHERE a.opportunity_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM opportunities o WHERE o.id = a.opportunity_id)
UNION ALL
SELECT
  'leads.converted_opportunity_id orphan',
  count(*)::bigint
FROM leads l
WHERE l.converted_opportunity_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM opportunities o WHERE o.id = l.converted_opportunity_id)
UNION ALL
SELECT
  'crosswalk opportunity without row',
  count(*)::bigint
FROM business_id_crosswalk x
WHERE x.entity_type = 'opportunity'
  AND NOT EXISTS (
    SELECT 1 FROM opportunities o
    WHERE o.id = x.legacy_numeric
       OR o.id::text = x.primary_ref
       OR o.business_id = x.business_id
  )
UNION ALL
SELECT
  'opportunity_parties without parent',
  count(*)::bigint
FROM opportunity_parties p
WHERE NOT EXISTS (SELECT 1 FROM opportunities o WHERE o.id = p.opportunity_id)
UNION ALL
SELECT
  'opportunity_proposed_premises without parent',
  count(*)::bigint
FROM opportunity_proposed_premises p
WHERE NOT EXISTS (SELECT 1 FROM opportunities o WHERE o.id = p.opportunity_id)
UNION ALL
SELECT
  'opportunity_documents without parent',
  count(*)::bigint
FROM opportunity_documents d
WHERE NOT EXISTS (SELECT 1 FROM opportunities o WHERE o.id = d.opportunity_id)
UNION ALL
SELECT
  'opportunity_proposals without parent',
  count(*)::bigint
FROM opportunity_proposals p
WHERE NOT EXISTS (SELECT 1 FROM opportunities o WHERE o.id = p.opportunity_id)
UNION ALL
SELECT
  'opportunity_commissions without parent',
  count(*)::bigint
FROM opportunity_commissions c
WHERE NOT EXISTS (SELECT 1 FROM opportunities o WHERE o.id = c.opportunity_id);

-- -----------------------------------------------------------------------------
-- 8) End discovery. Leaves no data changes.
-- -----------------------------------------------------------------------------

ROLLBACK;

-- =============================================================================
-- RESTORATION — DO NOT RUN IN THIS FILE
-- =============================================================================
-- No INSERT / UPDATE / DELETE belongs here.
-- If discovery finds no surviving opportunity row, restoration is a later
-- change-controlled step, from one of:
--   1) PostgreSQL backup / PITR taken before the delete
--   2) Import CSV / export package that still contains the opportunity
--   3) Manual recreate from surviving SET NULL remnants (activities, leads,
--      company notes) plus crosswalk M###### if still present
-- See scripts/recovery/heshuntai-opportunity-recovery-checklist.md
-- =============================================================================
