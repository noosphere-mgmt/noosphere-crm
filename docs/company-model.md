# Company model

**Status:** Approved — single table, multi-role, no party duplicates  
**Rule:** Do not create separate tables for Operators, Customers, Agents, Channels, Landlords, or similar.

---

## Single `companies` table

All parties are one company record. A firm may hold **multiple roles** (multi-select).

### Company Role (classification field)

Stored as `roles` (`text[]`). Controlled lookup:

| Role slug | UI label | Typical CRM view |
|-----------|----------|------------------|
| `client` | Client | **Customers** |
| `operator` | Operator | **Operators** |
| `landlord` | Landlord | **Landlords** |
| `agency` | Agency | **Agents** |
| `referrer` | Referrer | **Channels** |
| `fund` | Fund | Funds |
| `developer` | Developer | Developers |
| `investor` | Investor | Investors |

**CRM navigation** links to `/admin/companies?role={slug}` — filtered views, not separate modules.

### Core company fields

Company name (ZH), website, phone, email, industry, relationship owner, contact/meeting/follow-up dates, relationship strength, source, remarks, status (`is_active`).

Contacts and opportunities link via `company_id` / `primary_contact_id`.

---

## Property Portfolio links (optional FKs)

On inventory / Property Portfolio (`assets` target table):

| Column | Links to | Role hint |
|--------|----------|-----------|
| `operator_company_id` | `companies.id` | Operator |
| `landlord_company_id` | `companies.id` | Landlord |
| `current_tenant_company_id` | `companies.id` | Client or any (occupier) |

No separate operator or landlord tables. Offers may inherit operator from inventory or override later if needed.

---

## Legacy: `operators` table

**Deprecated.** Historical `inventory.operator_id` → migrate to `operator_company_id` on inventory when Priority #1 ships.

Until migration: legacy Operators admin remains read-only reference; new operators should be **Companies** with role Operator.

---

## Import

Company import template includes **Roles** column (comma-separated labels or slugs). Same controlled lookup as UI.

---

## Do not introduce

- `customers`, `agents`, `channels`, `landlords` tables  
- Company-to-company relationship graph (v1)  
- Separate CRM modules with duplicate data  

See [product-direction.md](./product-direction.md).
