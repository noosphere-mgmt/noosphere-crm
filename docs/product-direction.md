# Noosphere CRM — Product direction

**Status:** Approved architecture direction (frozen for future development)  
**Audience:** Internal team, agents, and implementers

---

## Project objective

Noosphere CRM is **not** a Hong Kong commercial property database.

It exists to:

1. Organise **known available spaces** (supply you actually work with)
2. Organise **operators, landlords, clients, and channels**
3. **Track opportunities**
4. **Generate proposals** efficiently
5. **Accumulate Noosphere’s proprietary knowledge base**
6. **Record transactions** (future)

### Optimise for

- Easy import
- Easy update
- Easy filtering
- Opportunity matching
- Proposal generation
- Knowledge retention

### Do NOT optimise for

- Full Hong Kong building coverage
- Complete floor/unit hierarchy
- Land registry–style ownership records
- Complex asset modelling
- Enterprise CRM complexity

**Rule:** Do not introduce additional entities unless there is a clear business requirement.

---

## Approved core modules

Four data modules + offers + import. Building remains an **address anchor**, not a coverage database.

```
Supply                          CRM
──────                          ───
Inventory (marketable space)    Company (multi-role)
  └── Offers (commercial terms)   └── Contact
                                    └── Opportunity
```

---

### 1. Inventory / Property Portfolio (supply)

**Purpose:** Supply database. One record = one **marketable space** Noosphere knows about — **property-type agnostic** (office, retail, industrial, residential, hotel, investment).

**Examples:** 22/F whole floor (Office) · Shop G12 (Retail) · Warehouse unit (Industrial) · Serviced office Room 7

| Field | Notes |
|-------|--------|
| **Property Category** | **Top-level** — Office · Serviced Office · Shared Office · Retail · Industrial · Residential · Hotel · Investment |
| **Property Type** | Secondary — Whole Floor · Unit · Suite · Room · Shop · Warehouse · En-bloc · … (form/layout; not office-specific schema) |
| Building | Address anchor (not full HK coverage goal) |
| Floor, Unit, Suite | Location within building |
| District, Street | Denormalised for filter/import ease |
| Area, Capacity | Matching metrics (capacity N/A for some categories — neutral score) |
| Current Landlord | `landlord_company_id` → Company (role Landlord) |
| Current Tenant | `current_tenant_company_id` → Company (optional) |
| Operator | `operator_company_id` → Company (role Operator) |
| Status | active / withdrawn / archived |
| Source, Last Updated, Remarks | Audit & knowledge retention |

**Classification detail:** [property-classification.md](./property-classification.md)

**Current implementation:** Split across `buildings`, `assets`, `inventory` (offers). Legacy fields (`asset_type`, `offer_type`, `workspace_type`) are **office-biased** — migrate to `property_category` + `property_type` on inventory.

**Not in scope:** Office-only schema; HK-wide building coverage; land-registry ownership; deep asset hierarchies.

---

### 2. Company (single table)

**Purpose:** All parties in one table. **No** separate Operators, Customers, Agents, Channels, or Landlords tables.

Detail: [company-model.md](./company-model.md)

**Company Role** (`roles`, multi-select): Client · Operator · Landlord · Agency · Referrer · Fund · Developer · Investor

| CRM view | Filter |
|----------|--------|
| Customers | `role=client` |
| Operators | `role=operator` |
| Landlords | `role=landlord` |
| Agents | `role=agency` |
| Channels | `role=referrer` |
| Funds / Developers / Investors | respective role filters |

| Field | Current | Gap |
|-------|---------|-----|
| Company Name / ZH | ✓ | — |
| Roles | ✓ | Add Developer, Investor in UI ✓ |
| Website, Phone, Email | ✓ | — |
| Industry | ✓ | — |
| Relationship Owner | ✓ | — |
| Last Contact / Meeting / Next Follow-up | ✓ | — |
| Relationship Strength | ✓ | — |
| Source | ✓ | — |
| Remarks | ✓ | — |
| Status | `is_active` | Rename UI to Status |

**Legacy:** `operators` table + `inventory.operator_id` — deprecate; use company FKs on inventory.

---

### 3. Contact

| Field | Current | Gap |
|-------|---------|-----|
| Company | ✓ | — |
| Contact Name, Title | ✓ | — |
| Email, Phone, WhatsApp, WeChat | ✓ | — |
| Preferred Language | ✓ | — |
| Last Contact / Next Follow-up | ✓ | — |
| Source | — | Add field |
| Remarks | ✓ | — |

**Current implementation:** `contacts` table + CRM-1 admin.

---

### 4. Opportunity

| Field | Current | Gap |
|-------|---------|-----|
| Opportunity Name | `title` (partial) | Finalise; deprecate loose `client_name` text |
| Company, Contact | ✓ FKs | — |
| Requirement Summary | ✓ | — |
| Budget, Area, Capacity | ✓ | — |
| District Preference | ✓ | — |
| **Property Category** (preference) | partial (`workspace_type`) | Replace workspace type; see [property-classification.md](./property-classification.md) |
| **Property Type** (preference) | — | Add; used in matching & proposals |
| Proposed Property | — | FK to inventory record |
| Partnership Type | — | Direct · Co-broke · Referral |
| Status | Extended pipeline | Align to: New · Sourcing · Proposal Sent · Negotiating · Won · Lost |
| Lead Source | ✓ `lead_source` | — |
| Created Date | ✓ `created_at` | — |
| Proposal Date | — | Add |
| Expected Close Date | ✓ | — |
| Closed Date | — | Add |
| Remarks | ✓ | — |

**Current implementation:** `opportunities` + offer matching (rules-based). Proposal generator not built.

---

### 5. Offers

Commercial terms on an inventory record: rent, sale price, availability, deposit, term, commission.

**Current:** `inventory` table, UI **Offers**. Stays linked to space/inventory record.

---

## UI philosophy

**Database stays simple. UI provides filtered views — not duplicate tables.**

### CRM views (all = filtered `companies` + `contacts`)

| UI label | Route |
|----------|--------|
| Companies | `/admin/companies` |
| Customers | `/admin/companies?role=client` |
| Operators | `/admin/companies?role=operator` |
| Landlords | `/admin/companies?role=landlord` |
| Agents | `/admin/companies?role=agency` |
| Channels | `/admin/companies?role=referrer` |
| Contacts | `/admin/contacts` |
| Opportunities | `/admin/opportunities` |

No duplicate party tables.

### Inventory views

| UI label | Content |
|----------|---------|
| Property Portfolio | Marketable spaces (inventory records) |
| Offers | Commercial terms on spaces |

### Detail pages (tabs = filtered related records)

**Building detail** (address anchor, not coverage DB):

- Overview · **Inventory** · Companies · Contacts · Opportunities · Transactions (future)

**Inventory detail** (primary supply record):

- Overview · **Offers** · **Opportunities** · History

Tabs query existing tables with filters — no parallel data stores.

---

## Import Workbench direction

One **full** import template per module (expose all practical fields — not minimal samples):

1. Inventory / Property Portfolio  
2. Company  
3. Contact  
4. Opportunity  

| Requirement | Target |
|-------------|--------|
| Default download format | **XLSX** |
| Also supported | CSV (UTF-8) |
| Template content | Full module field set |
| Engine | Existing patch semantics, match priority (id → external_ref → natural key), duplicate candidate, import_run_id |

**Current (IW-1):** Buildings + Companies CSV only — **transitional**. Next import phases align templates to the four modules above; building-only import becomes part of inventory row (building columns), not a separate product module.

See [import-workbench-iw1.md](./import-workbench-iw1.md) for implemented engine behaviour.

---

## Development priority (approved order)

| # | Work item | Notes |
|---|-----------|--------|
| 1 | **Finalise Inventory module** | `property_category` + `property_type`; agnostic schema; landlord/operator company links; Property Portfolio UI |
| 2 | **Finalise Company module** | Status label; CRM filtered views (Customers, Operators, …) |
| 3 | **Finalise Contact module** | Source field; company-scoped views |
| 4 | **Finalise Opportunity module** | Name, partnership type, category/type preferences, dates, status |
| 5 | **Improve Import Workbench** | Four full XLSX templates; inventory/company/contact/opportunity imports |
| 6 | **Build Matching** | Hard filter by Property Category & Type; score budget/area/district; shortlist |
| 7 | **Build Proposal Generator** | Respect category/type on shortlist & PDF |
| 8 | **Build Transaction Recording** | Post-deal ledger |

**Explicitly later / out of scope unless requested:** PDF/AI import, async jobs, mapping presets, enterprise CRM patterns, HK-wide building ingestion.

---

## Current codebase map (technical debt)

| Approved term | Target UI | Current DB | Transition |
|---------------|-----------|------------|------------|
| Inventory / space | Property Portfolio | `assets` | Add `property_category`, `property_type`; deprecate office-centric fields |
| Offer | Offers | `inventory` | Rename table in future phase |
| Building | Building (anchor) | `buildings` | Keep; slim admin prominence |
| Company | Company (+ role views) | `companies` | ✓ |
| Contact | Contact | `contacts` | ✓ |
| Opportunity | Opportunity | `opportunities` | Extend fields |
| Operator (legacy) | Operators (→ Companies) | `operators` | Deprecate; use `companies` + `operator_company_id` |
| Legacy site | Hidden | `properties` | Deprecate |

---

## Related docs

- [company-model.md](./company-model.md) — Single table, roles, inventory FKs
- [property-classification.md](./property-classification.md) — Category & type
- [brokerage-model.md](./brokerage-model.md) — Glossary (admin `/admin/glossary`)
- [offer-matching.md](./offer-matching.md) — Matching workflow
- [import-workbench-iw1.md](./import-workbench-iw1.md) — Import engine (IW-1)
