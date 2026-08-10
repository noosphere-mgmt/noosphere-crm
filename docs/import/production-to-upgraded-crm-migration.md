# Production to upgraded CRM migration

## Deployment rule

Run a dry-run import first. Import parent records before dependent records:

1. Companies
2. Contacts
3. Buildings
4. Premises
5. Opportunities
6. Opportunity parties
7. Opportunity proposed premises
8. Activities
9. Activity premises (historical/exceptional links only; skip when none exist)
10. Relationships
11. Leads (new module; no production predecessor)

Use the production business IDs and `external_ref` values wherever present. Never create new IDs merely because a display name changed.

## Clean wipe + re-import (this deploy)

When clearing production CRM data and reloading from export CSVs:

1. **Backup** the production database first.
2. Wipe business tables (preserve `users` / auth if separate). Truncate in FK-safe order, including:
   - `activity_premises`, activities, opportunity parties / proposed premises / documents / proposals
   - opportunities, relationships, leads
   - premises_v1, properties_v1
   - contacts, contacts_v1, companies, companies_v1
   - `business_id_crosswalk`, relevant `id_map_v1` rows
3. Import in the order above using **exported CSVs that already contain canonical IDs**:
   - `company_id` = `C######`
   - `contact_id` = `D######`
   - `building_id` = `B######`
   - `premises_id` = `P######`
   - `opportunity_id` = `M######`
   - `activity_id` = `A######`
4. Child files must reference parents by those same business IDs (not internal `INV-*` / numeric PKs).
5. Dry-run each file; fix unresolved lookups before commit.
6. After companies import, `companies_v1` is synced automatically (reuses the same `C######`).
7. Spot-check: open one company → contact → building → premise → opportunity → activity; confirm IDs and links.
8. Re-export each object and keep files with the deployment backup.

### Lookup rules (authoritative)

| CSV field | Accepts | Resolves to |
|---|---|---|
| company_id | `C######`, legacy numeric, external_ref, name (lookup) | companies.id (+ companies_v1) |
| contact_id | `D######`, legacy numeric, external_ref, name | contacts.id |
| building_id | `B######`, property_id, external_ref, name | properties_v1.property_id |
| premises_id | `P######`, premises_id, external_ref, name | premises_v1.premises_id |
| opportunity_id | `M######`, numeric id, external_ref, name | opportunities.id |
| activity_id | `A######`, activity_id, external_ref, name | activities.activity_id |

Missing explicit ID on create → new row + newly allocated business ID.  
Explicit ID not found → create and **preserve** that business ID.

## Field policy

- **Current fields** appear in new templates and exports and can be imported or updated.
- **Renamed fields** remain accepted as aliases so the production backup can be imported unchanged.
- **Retired/hidden fields** remain import-compatible for history, but are omitted from clean templates and exports.
- **Lookup fields** (for example company or contact names beside IDs) help resolve references; the referenced ID remains authoritative.
- **Derived fields** such as generated premises names and square-foot/square-metre conversions are recalculated by the application where appropriate.
- **Structured JSON fields** must remain valid JSON. In raw CSV, quotation marks may be doubled by CSV escaping; spreadsheet software normally handles this automatically.

## Important mappings

| Production heading | Current heading / treatment |
|---|---|
| `category` (building) | `building_type` |
| `no_of_floors` | `total_floors` |
| `property_type`, `property_category` (premises) | `asset_class` |
| `office_type`, `operating_model` | `product_subtype` |
| `listing_intent`, `transaction_intent` | `market_mode` |
| `offer_status` | `listing_status` |
| `workstation_count`, `desks` | `capacity_pax` / `required_capacity_pax` |
| `area_sqft` (opportunity) | `required_area_sqft` |
| `budget` | `budget_max` |
| `est_start_date` | `expected_close_date` |
| `monthly_rent` | `package_monthly_fee` |
| `asking_sale_price` | `asking_price` |
| `sale_price_psf` | `asking_price_psf` |
| `fit_out_condition` | `fit_out` |
| `view_type` | `view` |
| `notes` | `remarks` or `internal_remarks`, depending on object |

## Hidden historical fields

The importer still accepts the old opportunity `sales_type`, `usage_type`, `desks`, `area_sqft`, `budget`, and `est_start_date` columns. Old premises classification fields and payer-specific commission fields are also retained only for backward-compatible migration. Partnership mode and detailed party fee columns are not presented in the new clean templates.

`activity_premises` remains available to preserve an existing activity linked to several premises. Normal site tours should be managed through Opportunity Proposed Premises and an Opportunity Activity, so this object does not need to be populated for ordinary records.

## Relationship-file boundaries

`relationships.csv` is currently the directional referral-network file for Company and Contact endpoints only. It supports `Refers` and `Represents`; reverse rows are generated by the system. It does **not** replace these object-specific associations:

- Building role lines (Owner, Management Office, Occupant or Other) in `building_relationships`
- Premises role lines in `relationships`, plus operator/owner company references
- Opportunity client/referrer fields
- Opportunity Party rows
- Opportunity Proposed Premises rows

Keep those columns in their respective import files. Relationship arrays export as valid JSON, for example `[{"role":"Owner","company_id":"C100001","remarks":""}]` (shown without CSV-level quote doubling). If an older export contains `[object Object]`, discard that cell and create a fresh export; the original structured values cannot be reconstructed from that text.

## New fields with no production source

- Leads and email-intelligence fields
- Simplified Chinese property content
- Premises `asset_class`, `product_subtype`, `market_mode`, `offer_type`, `source_type`, square-metre areas, management-fee PSF, relationship lines, and listing remarks
- Building proposal content in English, Traditional Chinese, and Simplified Chinese; building relationships
- Opportunity budget range, expected close date, owner, referral company/contact, next action, waiting-for and lost reason
- Company/contact relationship-management dates, owner, strength, active/primary flags

Leave genuinely unknown new values blank. Apply defaults only where the product has an explicit default (`source_type = Direct`, date defaults on newly created premises, and the normal workflow status defaults).

## Validation before production cutover

- Compare counts by object before and after migration.
- Review all duplicate candidates rather than auto-creating them.
- Check unresolved company, contact, building and premises references.
- Spot-check multilingual names, areas, prices and dates.
- Confirm opportunity parties and proposed premises after their parent opportunities load.
- Export each object from the upgraded site after import and keep the files with the deployment backup.
- Confirm Building and Premises structured relationship cells export as JSON and successfully survive a dry-run re-import.
