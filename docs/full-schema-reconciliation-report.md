# Full Schema Reconciliation Report

Generated: 2026-06-19T17:56:31.196Z

Fresh schema: `migrate_fresh_full_recon` | Reference: `public` | Database: `noosphere_crm`

## Summary

| Metric | Count |
| --- | --- |
| Fresh migrate tables | 27 |
| Fresh migrate columns | 618 |
| Reference schema tables | 27 |
| Reference schema columns | 618 |
| Module queries verified | 19 |
| Module query failures | 0 |
| Missing tables on fresh migrate | 0 |
| Missing columns on fresh migrate | 0 |
| Missing tables on reference | 0 |
| Missing columns on reference (prod behind) | 0 |
| Unused columns (heuristic) | 59 |

## Module verification

- ✓ **Dashboard**
- ✓ **Connections (Companies)** — 0 rows
- ✓ **Connections (Contacts)** — 0 rows
- ✓ **Opportunities** — 0 rows
- ✓ **Activities** — 0 rows
- ✓ **Properties (Premises list)** — 0 rows
- ✓ **Properties (filter options)**
- ✓ **Buildings** — 0 rows
- ✓ **Buildings (count)**
- ✓ **Premises** — 0 rows
- ✓ **Premises (count)**
- ✓ **Quick Add Property (marketable)** — 0 rows
- ✓ **Quick Add Property (buildings)** — 0 rows
- ✓ **Quick Add Property (operators)** — 0 rows
- ✓ **Opportunity Premises Selector** — 0 rows
- ✓ **Opportunity Proposed Premises** — 0 rows
- ✓ **V1 company options** — 0 rows
- ✓ **V1 contact options** — 0 rows
- ✓ **V1 property select options** — 0 rows


## Missing tables (on fresh migrate)

(none — fresh migrate creates all reference tables)


## Missing columns (on fresh migrate vs reference)

(none — npm run db:migrate produces a complete schema)


## Missing on reference schema (production behind migrate)

(none — reference schema matches fresh migrate)


## Unused columns (heuristic — not found in lib/repos)

- `companies.market_specializations` (text[])
- `companies_v1.company_match_id` (TEXT)
- `companies_v1.company_type` (TEXT)
- `companies_v1.main_phone` (TEXT)
- `companies_v1.email_domain` (TEXT)
- `companies_v1.billing_address` (TEXT)
- `companies_v1.company_remarks` (TEXT)
- `companies_v1.company_source` (TEXT)
- `companies_v1.company_label` (TEXT)
- `company_channel_lines_v1.channel_type` (TEXT)
- `contacts_v1.mobile` (TEXT)
- `contacts_v1.contact_status` (TEXT)
- `contacts_v1.contact_source` (TEXT)
- `contacts_v1.legacy_contact_id` (BIGINT)
- `import_sessions.expires_at` (TIMESTAMPTZ)
- `opportunities.lead_source` (TEXT)
- `opportunities.source_type` (TEXT)
- `opportunities_v1.opportunity_type` (TEXT)
- `opportunities_v1.pipeline_status` (TEXT)
- `opportunities_v1.priority` (TEXT)
- `opportunities_v1.client_company_id` (TEXT)
- `opportunities_v1.client_contact_id` (TEXT)
- `opportunities_v1.target_districts` (TEXT)
- `opportunities_v1.target_capacity_pax` (INTEGER)
- `opportunities_v1.target_area_sqft` (NUMERIC)
- `opportunities_v1.lease_term_months` (INTEGER)
- `opportunities_v1.created_date` (DATE)
- `opportunities_v1.decision_date` (DATE)
- `opportunities_v1.legacy_opportunity_id` (BIGINT)
- `premises_v1.legacy_property_row_id` (BIGINT)
- `properties_v1.building_match_id` (TEXT)
- `properties_v1.legacy_building_id` (BIGINT)
- `proposal_items_v1.proposal_item_id` (TEXT)
- `proposal_items_v1.proposal_id` (TEXT)
- `proposal_items_v1.recommended` (BOOLEAN)
- `proposal_items_v1.recommendation_label` (TEXT)
- `proposal_items_v1.display_rent` (TEXT)
- `proposal_items_v1.net_effective_rent` (NUMERIC)
- `proposal_items_v1.total_initial_cost` (NUMERIC)
- `proposal_items_v1.pros` (TEXT)


_… and 19 more in JSON report_

## Migration consistency

- Phase files referenced in migrate.ts: **38**
- Orphan phase files (not in migrate.ts): schema-migrate-phase30-schema-reconciliation.sql
- Duplicate phase runs: schema-migrate-phase31-buildings-module-reconciliation.sql
- Tables created only in phases (not schema.sql): activities, activity_premises, company_channel_lines_v1, contact_relationships, contacts_v1, opportunities_v1, opportunity_parties, opportunity_proposed_premises, properties, proposal_items_v1, proposals_v1, relationships
- schema.sql columns missing after full migrate: (none)

