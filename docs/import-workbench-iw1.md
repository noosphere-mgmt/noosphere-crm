# Import Workbench — IW-1 (implemented)

> **Direction:** Future templates align to four modules (Inventory, Company, Contact, Opportunity) with **full-field XLSX** as default download. See [product-direction.md](./product-direction.md).

CSV import for **Buildings** and **Companies** with dry-run preview, patch semantics, and import history. Buildings import is **transitional** — will fold into Inventory/Property Portfolio import.

## Workflow

1. `/admin/import` — select object, upload UTF-8 CSV, optional source metadata
2. Column mapping — map CSV headers to system fields (unmapped columns ignored)
3. Preview — dry run: Create · Update · Clear value · No change · Duplicate candidate · Error
4. Confirm — writes to database; sets `import_run_id` on affected records
5. History — `/admin/import/history`

## Match priority

1. Internal `id`
2. `external_ref` (unique when set)
3. Natural key — Buildings: `name_en + district`; Companies: `company_name`

## Patch semantics

| CSV | Effect |
|-----|--------|
| Column not mapped | Field unchanged |
| Mapped column, blank cell | Clear existing value |
| Mapped column, value | Set / update value |

## Planned (post–IW-1)

| Module | Template | Format |
|--------|----------|--------|
| Inventory / Property Portfolio | All practical fields | XLSX + CSV |
| Company | All practical fields | XLSX + CSV |
| Contact | All practical fields | XLSX + CSV |
| Opportunity | All practical fields | XLSX + CSV |

No minimal templates — each template reflects the module’s full data model.

## Test scenarios (IW-1)

### Buildings

1. **Create** — new `external_ref` + name + district → Preview: Create
2. **Update** — same `external_ref`, change grade → Update
3. **Clear** — mapped column, empty cell → Clear value
4. **No change** — identical re-import → No change
5. **Duplicate candidate** — ambiguous natural key → Duplicate candidate
6. **Absent column** — unmapped field → unchanged

### Companies

1. **Create with roles** — `Client, Referrer` → controlled lookup slugs
2. **Invalid role** → Error
3. **Update by company name** → natural key match
4. **Source metadata** on upload form → applied when row fields blank

## Templates (current)

- Download: `/api/admin/import/template/buildings` or `companies`
- Files: `docs/import/templates/buildings.csv`, `companies.csv`
