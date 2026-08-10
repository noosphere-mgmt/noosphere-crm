# Noosphere CRM — Engineering Execution Plan

**Document type:** Formal execution specification  
**Status:** Approved for implementation (pending sign-off)  
**Scope:** Property model consolidation → premises_v1 inventory → matching → proposals → AI layer  
**Constraint:** Upgrade only — no system rebuild  

**Related specs:**
- [product-direction.md](./product-direction.md)
- [property-classification.md](./property-classification.md)
- [offer-matching.md](./offer-matching.md)
- [business-id-architecture.mdc](../.cursor/rules/business-id-architecture.mdc)

---

## Executive summary

This document defines how the existing Next.js CRM will converge on **`premises_v1` as the single operational inventory source**, replace legacy supply write paths, rebuild matching on V1 data, deliver a proposal generator on legacy opportunities, and add a read-only AI assistant layer.

Work is delivered in **four releases (R1–R4)** mapped to **eight migration phases (38–45)**. All schema changes are **additive** until an explicit cleanup release (out of scope here).

---

## 1. Approved architecture decisions

These decisions are **frozen for this execution plan**. Changes require explicit approval.

### AD-1: Upgrade, not rebuild

| Decision | Rationale |
|----------|-----------|
| Retain Next.js 16 App Router, server actions, `lib/repos/*`, raw SQL via `pg` | Production system is live; minimize risk |
| No new ORM, microservices, or parallel CRM stack | Avoid dual maintenance |
| Extend existing modules rather than replace admin shell | Preserves drawers, inline edit, mobile/desktop split |

### AD-2: Canonical supply model

| Layer | Canonical table | Role |
|-------|-----------------|------|
| Building (address anchor) | `properties_v1` | Not a coverage database; holds address & building metadata |
| **Inventory (marketable space)** | **`premises_v1`** | **Single operational write path for supply** |
| Commercial terms | Embedded on `premises_v1` | No separate offers table in R1–R3 (aligned with current V1 UI) |

**Deprecated for new writes (read-only after R1):**
- `properties` (marketable / quick-add)
- `buildings` → `assets` → `inventory` (legacy stack)
- `operators` (use `companies` with role Operator)

### AD-3: Business identity (frozen)

Per [business-id-architecture.mdc](../.cursor/rules/business-id-architecture.mdc):

| Entity | User-facing ID | Internal PK |
|--------|----------------|-------------|
| Company | `C######` | `companies.id` |
| Contact | `D######` | `contacts.id` |
| Building | `B######` | `properties_v1.property_id` + crosswalk |
| Premise | `P######` | `premises_v1.premises_id` + crosswalk |
| Opportunity | `M######` | `opportunities.id` |
| Activity | `A######` | `activities.id` |

- No new ID formats, suffix schemes, or resolver chains.
- ETL and imports must populate `business_id` and `business_id_crosswalk`.
- Numeric PKs remain internal only.

### AD-4: Property classification

Per [property-classification.md](./property-classification.md):

| Field | Location | Purpose |
|-------|----------|---------|
| `property_category` | `premises_v1` | Top-level class (Office, Retail, Industrial, …) — **hard filter for matching** |
| `property_type` | `premises_v1` (existing) | Secondary form (Whole Floor, Unit, Shop, …) |
| `space_form` | `premises_v1` | Normalized layout/deal form where distinct from `property_type` |
| `listing_intent` | `premises_v1` | lease / sale / both |
| `property_category_preference` | `opportunities` | Opportunity requirement — hard filter |
| `property_type_preference` | `opportunities` | Optional finer filter |

`workspace_type` on opportunities is **legacy**. New UI uses category + type preferences. Column retained for rollback; not populated on new records after R2.

### AD-5: CRM entities stay on legacy tables

| Entity | Table | Notes |
|--------|-------|-------|
| Companies, contacts, opportunities | `companies`, `contacts`, `opportunities` | Primary admin UI; numeric PK + business ID |
| V1 mirror tables | `companies_v1`, `contacts_v1`, `opportunities_v1` | Import/workbook alignment only; not a migration target for R1–R4 |

### AD-6: Proposals attach to legacy opportunities

| Decision | Rationale |
|----------|-----------|
| New tables `opportunity_proposals` + `opportunity_proposal_items` FK → `opportunities.id` | Live CRM uses legacy opportunities; `proposals_v1` FKs to `opportunities_v1` |
| Line items FK → `premises_v1.premises_id` | Inventory source of truth |
| `proposals_v1` / `proposal_items_v1` remain dormant | Avoid premature V1 CRM migration |

### AD-7: Matching engine target

| Decision | Rationale |
|----------|-----------|
| New `lib/matchPremises.ts` queries `premises_v1 ⋈ properties_v1` | Aligns matching with operational inventory |
| `lib/matchProperties.ts` becomes a compatibility shim | Existing callers unchanged |
| Hard filter: category + type; soft score: budget, area, capacity, district, dates | Per [offer-matching.md](./offer-matching.md) |

### AD-8: AI layer constraints

| Decision | Rationale |
|----------|-----------|
| Read-only tool functions over repos | No autonomous mutations |
| User must confirm all writes (proposal text, imports, field patches) | Compliance & data quality |
| `ai_interaction_log` for audit | No raw PII in stored prompts; summaries only |
| Feature-flagged (`AI_ASSISTANT_ENABLED`) | Safe rollout |

### AD-9: Feature flags (environment)

| Flag | Default (prod rollout) | Purpose |
|------|------------------------|---------|
| `LEGACY_SUPPLY_WRITES` | `0` after R1 | Emergency re-enable `properties` / inventory writes |
| `MATCH_ENGINE_V1` | `0` → `1` in R2 | Switch matcher to premises_v1 |
| `PROPOSALS_ENABLED` | `0` → `1` in R3 | Show proposal UI |
| `AI_ASSISTANT_ENABLED` | `0` → `1` in R4 | Show AI panel |

---

## 2. Database migration sequence

### 2.1 Principles

1. **Additive only** — no `DROP TABLE` / `DROP COLUMN` in phases 38–45.
2. **Register every phase** in [scripts/migrate.ts](../scripts/migrate.ts).
3. **`npm run db:backup`** before production migrate.
4. **Data scripts are separate** from DDL and are idempotent.
5. Run **`npm run db:full-reconciliation`** after each production migrate.

### 2.2 Phase catalogue

| Phase | File | Release | DDL summary |
|-------|------|---------|-------------|
| **38** | `schema-migrate-phase38-premises-category.sql` | R1 | Add `property_category`, `listing_intent`, `space_form` to `premises_v1`; indexes |
| **39** | `schema-migrate-phase39-opportunity-preferences.sql` | R1 | Add `property_category_preference`, `property_type_preference` to `opportunities` |
| **40** | `schema-migrate-phase40-supply-crosswalk.sql` | R1 | Unique index on `legacy_property_row_id`; deprecation comments on legacy tables |
| **41** | `schema-migrate-phase41-freeze-legacy-supply.sql` | R1 | Optional: DB-level revoke INSERT/UPDATE on legacy supply (prod-only, post-stabilisation) |
| **42** | `schema-migrate-phase42-matching-indexes.sql` | R2 | Composite indexes for match queries on `premises_v1`, `properties_v1` |
| **43** | `schema-migrate-phase43-opportunity-proposals.sql` | R3 | Create `opportunity_proposals`, `opportunity_proposal_items` |
| **44** | `schema-migrate-phase44-proposal-pricing.sql` | R3 | Add `pricing_snapshot JSONB` on proposal items |
| **45** | `schema-migrate-phase45-ai-audit.sql` | R4 | Create `ai_interaction_log` |

### 2.3 Data migration scripts (not in migrate.ts DDL chain)

| Script | Release | When to run | Purpose |
|--------|---------|-------------|---------|
| `scripts/backfill-premises-category.ts` | R1 | After phase 38 on staging/prod | Map existing premises fields → category / space_form / listing_intent |
| `scripts/etl-properties-to-premises-v1.ts` | R1 | After phase 40 on staging/prod | Ensure every `properties` row has `premises_v1` row via `legacy_property_row_id` |
| `scripts/verify-supply-consolidation.ts` | R1 | CI + post-deploy | Row counts, unmapped properties, category null rate |

### 2.4 Execution order (single environment)

```
1. npm run db:backup
2. npm run db:migrate                    # applies phases through 45 when registered
3. npm run db:populate-business-ids      # if gaps detected
4. npx ts-node scripts/backfill-premises-category.ts
5. npx ts-node scripts/etl-properties-to-premises-v1.ts
6. npm run db:full-reconciliation
7. npm run verify:v1
8. npx ts-node scripts/verify-supply-consolidation.ts
```

**R2 onward:** phases 42+ only require steps 1, 2, 6, and release-specific verify scripts.

### 2.5 Phase 38 DDL reference

```sql
ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS property_category TEXT NULL,
  ADD COLUMN IF NOT EXISTS listing_intent TEXT NULL
    CHECK (listing_intent IS NULL OR listing_intent IN ('lease', 'sale', 'both')),
  ADD COLUMN IF NOT EXISTS space_form TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_premises_v1_category
  ON premises_v1 (property_category) WHERE property_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_premises_v1_inventory_status
  ON premises_v1 (inventory_status);
```

### 2.6 Phase 43 DDL reference

```sql
CREATE TABLE IF NOT EXISTS opportunity_proposals (
  id                BIGSERIAL PRIMARY KEY,
  opportunity_id    BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  proposal_date     DATE NULL,
  language          TEXT NULL DEFAULT 'en',
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'sent', 'accepted', 'superseded')),
  executive_summary TEXT NULL,
  consultancy_advice TEXT NULL,
  output_file       TEXT NULL,
  sent_date         DATE NULL,
  remarks           TEXT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunity_proposal_items (
  id                   BIGSERIAL PRIMARY KEY,
  proposal_id          BIGINT NOT NULL REFERENCES opportunity_proposals(id) ON DELETE CASCADE,
  premises_id          TEXT NOT NULL REFERENCES premises_v1(premises_id) ON DELETE RESTRICT,
  rank                 INTEGER NULL,
  recommended          BOOLEAN NOT NULL DEFAULT FALSE,
  recommendation_label TEXT NULL,
  display_rent         TEXT NULL,
  net_effective_rent   NUMERIC(14, 2) NULL,
  total_initial_cost   NUMERIC(14, 2) NULL,
  pros                 TEXT NULL,
  cons                 TEXT NULL,
  advisor_comment      TEXT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (proposal_id, premises_id)
);
```

---

## 3. File changes by phase

Legend: **(N)** = new file · **(M)** = modify · **(D)** = deprecate / read-only guard · **(R)** = redirect

### Release R1 — Single inventory source (Phases 38–41)

**Goal:** `premises_v1` is the only supply write path; classification fields live; legacy supply frozen.

#### Migrations & scripts

| File | Action |
|------|--------|
| `scripts/schema-migrate-phase38-premises-category.sql` | **N** |
| `scripts/schema-migrate-phase39-opportunity-preferences.sql` | **N** |
| `scripts/schema-migrate-phase40-supply-crosswalk.sql` | **N** |
| `scripts/schema-migrate-phase41-freeze-legacy-supply.sql` | **N** (optional) |
| `scripts/backfill-premises-category.ts` | **N** |
| `scripts/etl-properties-to-premises-v1.ts` | **N** |
| `scripts/verify-supply-consolidation.ts` | **N** |
| `scripts/migrate.ts` | **M** — register phases 38–41 |
| `scripts/verify-v1.ts` | **M** — unmapped row checks |
| `package.json` | **M** — add `verify:supply-consolidation` script |

#### Repos & domain logic

| File | Action |
|------|--------|
| `lib/repos/premisesV1.ts` | **M** — CRUD for new columns; list filters |
| `lib/repos/propertiesV1.ts` | **M** — read-only building anchor (no behavioural change) |
| `lib/repos/marketableProperties.ts` | **D** — guard INSERT/UPDATE/DELETE |
| `lib/repos/inventory.ts` | **D** — guard writes |
| `lib/repos/assets.ts` | **D** — guard writes |
| `lib/quickAddProperty.ts` | **R** — delegate to premises create or throw |
| `lib/v1ListValues.ts` | **M** — `PROPERTY_CATEGORIES`, `LISTING_INTENTS` |
| `lib/types/entities.ts` | **M** — PremisesV1 + Opportunity preference types |
| `lib/premisesFieldPatch.ts` | **M** — patch handlers for category fields |
| `lib/premisesDisplay.ts` | **M** — display labels |
| `lib/inlineRecordMerge.ts` | **M** — opportunity preference patches |

#### Admin UI — Properties

| File | Action |
|------|--------|
| `app/admin/properties/actions.ts` | **M** |
| `app/admin/properties/premises/new/page.tsx` | **M** — default fields |
| `components/admin/properties-v1/PremisesDrawer.tsx` | **M** |
| `components/admin/properties-v1/PremisesInlineOverviewDesktop.tsx` | **M** |
| `components/admin/properties-v1/PremisesInlineOverviewMobile.tsx` | **M** |
| `components/admin/properties-v1/PremisesFiltersBarDesktop.tsx` | **M** — category filter |
| `components/admin/properties-v1/PremisesListDesktop.tsx` | **M** — category column |
| `components/admin/properties-v1/AllPremisesWorkspace.tsx` | **M** |

#### Admin UI — Legacy redirect

| File | Action |
|------|--------|
| `app/admin/quick-add-offer/page.tsx` | **R** → `/admin/properties/premises/new` |
| `app/admin/quick-add-offer/actions.ts` | **R** |
| `app/admin/quick-add-inventory/page.tsx` | **R** (already redirects) |
| `app/admin/inventory/page.tsx` | **M** — read-only banner + link to premises |
| `lib/adminNavItems.ts` | **M** — hide legacy inventory/assets from nav |

#### Opportunities — preference fields

| File | Action |
|------|--------|
| `components/admin/OpportunityFormFields.tsx` | **M** |
| `components/admin/opportunities/OpportunityRequirementFields.tsx` | **M** |
| `components/admin/opportunities/OpportunityRequirementInlineFields.tsx` | **M** |
| `app/admin/opportunities/actions.ts` | **M** |

#### Import / export

| File | Action |
|------|--------|
| `lib/import/adapters/premises.ts` | **M** — category, listing_intent, space_form |
| `docs/import/templates/premises.csv` | **M** |

---

### Release R2 — Smart matching (Phase 42)

**Goal:** Matcher reads `premises_v1`; UI surfaces ranked matches on opportunities.

#### Migrations & scripts

| File | Action |
|------|--------|
| `scripts/schema-migrate-phase42-matching-indexes.sql` | **N** |
| `scripts/migrate.ts` | **M** |
| `scripts/verify-match-premises.ts` | **N** |
| `package.json` | **M** — `verify:match-premises` |

#### Domain & repos

| File | Action |
|------|--------|
| `lib/matchPremises.ts` | **N** — core engine |
| `lib/matchProperties.ts` | **M** — delegate to matchPremises when `MATCH_ENGINE_V1=1` |
| `lib/matchOffers.ts` | **M** — unchanged shim |
| `lib/types/entities.ts` | **M** — `MatchedProperty`: add `premises_id`, `premises_business_id` |

#### Admin UI

| File | Action |
|------|--------|
| `components/admin/opportunities/OpportunityMatchesPanel.tsx` | **N** |
| `components/admin/opportunities/OpportunityOverviewTab.tsx` | **M** — embed matches panel |
| `components/admin/opportunities/PremisesSelectorModal.tsx` | **M** — “From matches” source |
| `components/admin/opportunities/OpportunityProposedPremisesTab.tsx` | **M** — add-from-match action |
| `lib/repos/opportunityDetail.ts` | **M** — optional preload |

---

### Release R3 — Proposal generator (Phases 43–44)

**Goal:** Draft → edit → PDF → sent workflow on legacy opportunities.

#### Migrations & scripts

| File | Action |
|------|--------|
| `scripts/schema-migrate-phase43-opportunity-proposals.sql` | **N** |
| `scripts/schema-migrate-phase44-proposal-pricing.sql` | **N** |
| `scripts/migrate.ts` | **M** |
| `scripts/verify-opportunity-proposals.ts` | **N** |

#### Domain & repos

| File | Action |
|------|--------|
| `lib/repos/opportunityProposals.ts` | **N** |
| `lib/pricing/netEffectiveRent.ts` | **N** |
| `lib/proposals/renderProposalPdf.ts` | **N** |
| `lib/proposals/templates/defaultProposal.tsx` | **N** |
| `lib/proposalStorage.ts` | **N** |
| `app/admin/opportunities/proposalActions.ts` | **N** |

#### Admin UI

| File | Action |
|------|--------|
| `components/admin/opportunities/OpportunityProposalEditor.tsx` | **N** |
| `components/admin/opportunities/OpportunityProposalItemsTable.tsx` | **N** |
| `components/admin/opportunities/OpportunityNotesTab.tsx` | **M** — replace `OpportunityProposalsTab` placeholder |
| `components/admin/opportunities/OpportunityDetailPageClient.tsx` | **M** |
| `components/admin/opportunities/OpportunityDetailTabs.tsx` | **M** |
| `lib/repos/opportunityProposedPremises.ts` | **M** — “Promote to proposal” |

---

### Release R4 — AI assistant (Phase 45)

**Goal:** Read-only assistant with audit log on opportunity and premise detail.

#### Migrations & scripts

| File | Action |
|------|--------|
| `scripts/schema-migrate-phase45-ai-audit.sql` | **N** |
| `scripts/migrate.ts` | **M** |

#### Domain & API

| File | Action |
|------|--------|
| `lib/ai/assistant.ts` | **N** |
| `lib/ai/tools/searchPremises.ts` | **N** |
| `lib/ai/tools/getOpportunityContext.ts` | **N** |
| `lib/ai/tools/draftProposalCopy.ts` | **N** |
| `lib/repos/aiInteractionLog.ts` | **N** |
| `app/api/admin/ai/chat/route.ts` | **N** |

#### Admin UI

| File | Action |
|------|--------|
| `components/admin/ai/AssistantPanel.tsx` | **N** |
| `components/admin/opportunities/OpportunityDetailPageClient.tsx` | **M** |
| `components/admin/properties-v1/PremisesDetailPageClient.tsx` | **M** |
| `.env.example` | **M** — `AI_PROVIDER_API_KEY`, `AI_MODEL`, `AI_ASSISTANT_ENABLED` |

---

## 4. Testing requirements

### 4.1 Automated verification (CI / pre-deploy)

| Script | Release | Asserts |
|--------|---------|---------|
| `npm run typecheck` | All | TypeScript clean |
| `npm run build` | All | Production build succeeds |
| `npm run db:full-reconciliation` | All | Schema matches reference; module queries pass |
| `npm run verify:v1` | R1 | premises_v1 ↔ properties_v1 join integrity |
| `npm run verify:supply-consolidation` | R1 | Zero unmapped `properties` rows; category backfill rate ≥ threshold |
| `npm run verify:match-premises` | R2 | Known fixture opportunity → expected premises IDs |
| `npm run verify:premises-import-commit` | R1 | Import still creates premises with new fields |
| `npm run verify:company-export-ids` | R1 | Business IDs on export |
| `npm run verify:crm-ref-resolve` | R1–R3 | FK resolution for premises company refs |
| `scripts/verify-opportunity-proposals.ts` | R3 | Create proposal → items → PDF path set |

### 4.2 Unit tests (new, targeted)

| Module | Cases |
|--------|-------|
| `lib/pricing/netEffectiveRent.ts` | Face rent, rent-free, term, fit-out contribution |
| `lib/matchPremises.ts` | Hard filter category/type; score threshold ≥ 25; empty preference = no filter |
| `scripts/backfill-premises-category.ts` | Mapping table for each legacy offer_type / centre_type |
| `lib/proposals/renderProposalPdf.ts` | Snapshot HTML structure (no pixel diff required in v1) |

### 4.3 Manual QA checklist (staging)

#### R1 — Single inventory

- [ ] Create premise via `/admin/properties/premises/new` — category required in UI
- [ ] Edit category inline on premise detail — persists after refresh
- [ ] Import premises CSV with `property_category` — preview + commit
- [ ] Quick-add URL redirects to premises create
- [ ] `/admin/inventory` shows read-only banner; no successful create
- [ ] Opportunity form saves category/type preferences
- [ ] Export premises includes business ID `P######`
- [ ] Run ETL script — `properties` count == mapped `legacy_property_row_id` count

#### R2 — Matching

- [ ] Opportunity with category preference returns only matching premises
- [ ] Matches panel visible on opportunity overview (flag on)
- [ ] “Add to proposed premises” from match row works
- [ ] Prof Service opportunity hides property requirement matches appropriately
- [ ] Flag off (`MATCH_ENGINE_V1=0`) restores legacy matcher behaviour

#### R3 — Proposals

- [ ] Create draft proposal from proposed-premises shortlist
- [ ] Reorder items; mark recommended; edit display rent
- [ ] Generate PDF; file downloadable; stored path in `output_file`
- [ ] Mark sent; status = sent; `sent_date` set
- [ ] Proposal item references `premises_v1.premises_id` (business ID in PDF)
- [ ] Flag off hides Proposals tab content

#### R4 — AI

- [ ] Assistant panel loads on opportunity detail (flag on)
- [ ] “Search premises like …” returns results consistent with list filters
- [ ] Draft proposal copy — user must paste/confirm; no auto-save
- [ ] `ai_interaction_log` row created per request; no raw email/phone in log
- [ ] Flag off hides panel; API returns 404 or 403

### 4.4 Performance smoke tests

| Query | Target (staging, ~1k premises) |
|-------|--------------------------------|
| Premises list with category filter | < 500 ms server render |
| Match for one opportunity | < 1 s |
| PDF generation (5 items) | < 10 s |

---

## 5. Rollback procedure

### 5.1 Decision matrix

| Symptom | First action | Data rollback needed? |
|---------|--------------|------------------------|
| UI regression only | Redeploy previous git tag | No |
| Matcher returns wrong results | Set `MATCH_ENGINE_V1=0` | No |
| Proposal PDF broken | Set `PROPOSALS_ENABLED=0` | No |
| AI errors / leakage | Set `AI_ASSISTANT_ENABLED=0` | No |
| ETL corrupted premises | Restore DB backup | **Yes** |
| Category backfill wrong | Forward-fix script OR restore backup | Maybe |

### 5.2 Application rollback

```bash
# 1. Identify last good release tag
git log --oneline -5

# 2. Checkout and rebuild
git checkout <tag>
npm ci
npm run build

# 3. Restart process (production)
pm2 restart noosphere-realestate

# 4. Disable new features via env
# MATCH_ENGINE_V1=0
# PROPOSALS_ENABLED=0
# AI_ASSISTANT_ENABLED=0
# LEGACY_SUPPLY_WRITES=1   # emergency only
```

### 5.3 Database rollback

**Preferred:** Restore from pre-migrate backup.

```bash
npm run db:backup   # taken BEFORE migrate — keep 7 days minimum
# Restore via ops runbook / pg_restore / manual SQL restore
```

**Schema phases 38–45:** DDL is additive. Roll-forward fixes preferred over `DROP COLUMN`.

**ETL rollback (R1):**
1. Identify rows touched: `SELECT premises_id FROM premises_v1 WHERE import_run_id = <etl_run_id>`
2. If ETL tagged runs: delete inserted rows or restore from `backups/pre-etl-premises.csv`
3. Re-run verification scripts

**Optional forward rollback scripts** (create only if prod incident requires):

| File | Action |
|------|--------|
| `scripts/rollback-phase38-category.sql` | `DROP COLUMN property_category, listing_intent, space_form` — **last resort** |
| `scripts/rollback-phase43-proposals.sql` | `DROP TABLE opportunity_proposal_items, opportunity_proposals` |

### 5.4 Communication template

On rollback, record:
- Release version reverted
- Feature flags set
- Backup restore ID (if any)
- Row counts: `properties`, `premises_v1`, unmapped count
- Incident owner and follow-up ticket

---

## 6. Acceptance criteria by release

### R1 — Single inventory source

**Release tag:** `v0.5-inventory` (suggested)

| # | Criterion | Verification |
|---|-----------|--------------|
| R1-AC-1 | All new marketable space records created only in `premises_v1` | No successful INSERT to `properties` / `inventory` with `LEGACY_SUPPLY_WRITES=0` |
| R1-AC-2 | ≥ 95% of active premises have non-null `property_category` after backfill | `verify-supply-consolidation` |
| R1-AC-3 | 100% of `properties` rows mapped to `premises_v1.legacy_property_row_id` | `verify-supply-consolidation` |
| R1-AC-4 | Premises UI: create, edit inline, import, export include category | Manual QA |
| R1-AC-5 | Quick-add routes redirect to premises create | Manual QA |
| R1-AC-6 | Legacy inventory UI read-only with clear messaging | Manual QA |
| R1-AC-7 | Opportunity preference fields persist (category + type) | Manual QA |
| R1-AC-8 | `npm run db:full-reconciliation` passes; `npm run build` passes | CI |
| R1-AC-9 | Production migrate completed with pre/post backup | Ops log |

**Out of scope for R1:** Matching rewrite, proposals, AI, dropping legacy tables.

---

### R2 — Smart matching

**Release tag:** `v0.6-matching` (suggested)

| # | Criterion | Verification |
|---|-----------|--------------|
| R2-AC-1 | Matcher queries `premises_v1 ⋈ properties_v1` when `MATCH_ENGINE_V1=1` | Code review + integration test |
| R2-AC-2 | Hard filter excludes premises where category ≠ opportunity preference (when preference set) | `verify-match-premises` fixtures |
| R2-AC-3 | Matches panel visible on opportunity detail | Manual QA |
| R2-AC-4 | User can add match result to proposed premises in one action | Manual QA |
| R2-AC-5 | Legacy matcher available when flag off | Manual QA |
| R2-AC-6 | No regression to proposed-premises, parties, or fees tabs | Manual QA |
| R2-AC-7 | Match query < 1 s for typical opportunity on staging | Performance smoke |

**Out of scope for R2:** PDF proposals, AI, workspace_type column removal.

---

### R3 — Proposal generator

**Release tag:** `v0.7-proposals` (suggested)

| # | Criterion | Verification |
|---|-----------|--------------|
| R3-AC-1 | User creates draft proposal linked to `opportunities.id` | Manual QA |
| R3-AC-2 | Proposal line items reference `premises_v1.premises_id` | DB FK + UI |
| R3-AC-3 | Promote from proposed-premises populates line items | Manual QA |
| R3-AC-4 | PDF generates with premise details and business IDs | Manual QA + file check |
| R3-AC-5 | NER / pricing fields populated via `lib/pricing/netEffectiveRent.ts` | Unit test |
| R3-AC-6 | Sent status + `sent_date` + `output_file` persisted | Manual QA |
| R3-AC-7 | `PROPOSALS_ENABLED=0` hides feature without errors | Manual QA |
| R3-AC-8 | `verify-opportunity-proposals` passes in CI | CI |

**Out of scope for R3:** Email send, client portal, e-signature, AI draft.

---

### R4 — AI assistant

**Release tag:** `v0.8-ai` (suggested)

| # | Criterion | Verification |
|---|-----------|--------------|
| R4-AC-1 | Assistant panel on opportunity and premise detail when flag on | Manual QA |
| R4-AC-2 | All tool functions are read-only (no direct INSERT/UPDATE) | Code review |
| R4-AC-3 | User confirms before any suggested text applied to forms | Manual QA |
| R4-AC-4 | Each interaction logged in `ai_interaction_log` | DB query |
| R4-AC-5 | Logs contain summaries only — no raw PII | Code review + spot check |
| R4-AC-6 | API protected by existing admin auth middleware | Manual / automated |
| R4-AC-7 | `AI_ASSISTANT_ENABLED=0` disables panel and API | Manual QA |
| R4-AC-8 | Draft proposal copy tool integrates with R3 editor (paste flow) | Manual QA |

**Out of scope for R4:** Autonomous import, auto-status changes, embeddings / semantic index, external web search.

---

## 7. Governance & sign-off

| Role | Responsibility | Sign-off |
|------|----------------|----------|
| Product owner | Category mapping rules, proposal PDF layout | ☐ |
| Engineering lead | Migration sequence, rollback runbook | ☐ |
| Ops | Backup/restore verified on staging | ☐ |
| QA | Manual checklists R1–R4 complete on staging | ☐ |

**Implementation start condition:** All four sign-offs above + staging backup restore drill completed.

---

## 8. Document history

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-08-06 | Engineering | Initial formal execution plan |

---

*End of document. No application code is modified by this specification.*
