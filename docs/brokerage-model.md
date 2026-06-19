# Noosphere brokerage model

Internal glossary. See **[product-direction.md](./product-direction.md)** and **[company-model.md](./company-model.md)**.

## Company (single table)

One `companies` table for all parties. **Company Role** field (`roles`, multi-select):

Client · Operator · Landlord · Agency · Referrer · Fund · Developer · Investor

**CRM views** (Customers, Operators, Agents, Channels, …) = filtered company lists — **not** separate tables.

## Inventory links to companies

Optional FKs on Property Portfolio: `operator_company_id`, `landlord_company_id`, `current_tenant_company_id`.

## Core modules

### Inventory / Property Portfolio

Property-type agnostic supply. [property-classification.md](./property-classification.md)

### Offer · Building · Contact · Opportunity

Unchanged — see prior glossary sections in git history or product-direction.

## Hierarchy

```
Building → Inventory (company FKs) → Offer
Company → Contact → Opportunity
```

## Legacy

| Deprecated | Replacement |
|------------|-------------|
| `operators` table | Company role Operator |
| `inventory.operator_id` | `operator_company_id` on inventory |
| Separate CRM party tables | Never — use role filters |

## Priority

Inventory → Company → Contact → Opportunity → Import → Matching → Proposals → Transactions
