# Beijing Heshuntai Cloud / AI Data Center — opportunity recovery checklist

Read-only production investigation. Do not restore anything in this pass.

The live Opportunity site uses production PostgreSQL via `NOOSPHERE_DATABASE_URL` on the Hostinger VPS (PM2 `noosphere-crm`, internal port 3002). This laptop checkout does **not** contain that URL. Run discovery on the VPS (or a production replica) only.

Do not assume any local database contains this record.

---

## What delete does in this schema

Application code (`lib/repos/opportunities.ts`) runs:

```sql
DELETE FROM opportunities WHERE id = $1
```

There is **no** `deleted_at`, `is_active`, or archive table on `opportunities`. Closed statuses (`closed_won`, `closed_lost`) are still live rows, not a recycle bin.

That delete is a **hard delete**, with **database cascade** on required children:

| Child | ON DELETE |
| --- | --- |
| `opportunity_parties` | CASCADE |
| `opportunity_proposed_premises` | CASCADE |
| `opportunity_documents` (DB rows) | CASCADE |
| `opportunity_proposals` (and items via proposal FK) | CASCADE |
| `opportunity_commissions` | CASCADE |
| `activities.opportunity_id` | SET NULL (activity row kept) |
| `leads.converted_opportunity_id` | SET NULL (lead row kept) |
| `business_id_crosswalk` / `id_map_v1` | **no FK** — M###### mapping can survive |
| Files under `data/opportunity-documents/{legacy_id}/` | **not** removed by SQL cascade |

Companies and contacts are **not** deleted with the opportunity (`opportunities.company_id` is `ON DELETE SET NULL` in the other direction: deleting a **company** clears the opportunity’s company link).

Confirm the same FK list on production with section 0 of the SQL file. Production catalog is the authority if it differs from this repo.

There is **no** opportunity audit/history table in this schema. The only building-related audit table is `building_merge_audit` (unrelated). Surviving evidence is: still-present opportunity row, SET NULL leftovers, import JSON, crosswalk, disk files, or a PostgreSQL backup.

---

## A. Access (no writes)

- [ ] SSH to the production VPS (or a read replica). Do not point local `.env.local` at production.
- [ ] Confirm the URL is production PostgreSQL (host is not `127.0.0.1` from this laptop).
- [ ] Prefer a session role that can `SELECT` only. If using the app role, keep the SQL file’s `BEGIN READ ONLY` / `ROLLBACK`.
- [ ] Do **not** run `npm run db:migrate`, deploy, or any INSERT/UPDATE/DELETE.
- [ ] Optional: `pg_dump --schema-only` is read-only and useful to archive FK definitions.

---

## B. Discovery (run these commands)

Script: `scripts/recovery/heshuntai-opportunity-discovery.sql`

```bash
psql "$NOOSPHERE_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f scripts/recovery/heshuntai-opportunity-discovery.sql
```

Safer if `ON_ERROR_STOP` would abort on a missing optional table:

```bash
psql "$NOOSPHERE_DATABASE_URL" \
  -f scripts/recovery/heshuntai-opportunity-discovery.sql
```

If a statement errors with `relation "…" does not exist`, skip that section and continue. The file ends with `ROLLBACK`.

### What each section answers

| Section | Purpose |
| --- | --- |
| 0 | Session is read-only; list opportunity-related columns; **FK ON DELETE behaviour on this database**; triggers |
| 1 | Company PK / `business_id` for Beijing Heshuntai Cloud (legacy `companies` and `companies_v1`, including `is_active = false`) |
| 2 | Any remaining opportunity row (all statuses). There is no soft-deleted opportunity store to search. Also checks `opportunities_v1` |
| 3 | Surviving `M######` in `business_id_crosswalk` and `id_map_v1` after a hard delete |
| 4 | Parties, proposed premises, documents, proposals, commissions — should be empty if CASCADE ran |
| 5 | Activities and leads that still mention the company after `opportunity_id` was set null |
| 6 | `relationships`, import runs/rows/sessions, company notes |
| 7 | Counts of orphan parent ids |

### Also on the VPS filesystem (read-only)

Document files are stored as `{legacy_opportunity_id}/{uuid}.ext` under `OPPORTUNITY_DOCUMENTS_ROOT` or `data/opportunity-documents`. SQL cascade does not delete those files.

```bash
# Read-only listing. Do not rm.
ls -la data/opportunity-documents
# If section 3 produced a numeric id, for example 123:
find data/opportunity-documents -maxdepth 2 -type d -name '123'
```

---

## C. Interpret (still no restore)

Record:

- [ ] Company id(s) and `C######` / `companies_v1.company_id`
- [ ] Whether an `opportunities` row still exists (if yes, it was not deleted — check filters / company link)
- [ ] Whether only a crosswalk `M######` remains (hard delete + leftover identity)
- [ ] Activity ids whose `opportunity_id` is now NULL but notes/subject match
- [ ] Import `raw_row` JSON that could rebuild fields
- [ ] Disk folders that still hold files for a numeric opportunity id
- [ ] Timestamp of delete, if known (PM2 logs / operator memory) — needed for PITR

**If the opportunity row is gone and CASCADE FKs are present, child parties/premises/documents/proposals/commissions cannot be queried back from those tables.** Recovery then depends on backup, import JSON, or manual recreate from SET NULL remnants.

---

## D. Restoration (later, separate change control)

**Do not run restore SQL in the discovery session.**

A later restore, if approved, would be one of:

1. **PITR / backup restore of the deleted row only** (preferred if a dump or WAL from before delete exists). Restore into a scratch database first; copy one opportunity by `id`/`business_id`. Never restore a full dump over live production without a freeze.
2. **Re-import** from an opportunities CSV / import workbench export if `import_run_rows.raw_row` still has the record.
3. **Manual recreate** in the UI from surviving company, contacts, activities, and notes. A new `M######` would be allocated unless a controlled insert reuses the leftover crosswalk id (that needs an explicit identity decision).

None of those steps are in the discovery script.

---

## Stop

After discovery, stop. Share the company id, any leftover `M######`, and whether section 2 returned a live opportunity row before anyone writes restoration SQL.
