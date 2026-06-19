# Offer matching workflow

Rules-based matching from an **Opportunity** (client requirement) to **Offers** in the supply side. No proposal generator yet — matching is the prerequisite.

**Classification:** Matching and future proposals filter by **[Property Category and Property Type](./property-classification.md)** on inventory — not office-only `workspace_type` / `offer_type` maps.

## Flow

```mermaid
flowchart LR
  O[Opportunity] --> F[Filter by Property Category & Type]
  F --> M[Score: budget, area, district, dates]
  M --> D[Ranked matches on opportunity detail]
  D --> S[Shortlist future]
  S --> P[Proposal generator future]
```

## Candidate pool

Offers included when:

- `inventory.status` is `available` or `proposed`
- Joined to inventory (`assets`) and `buildings` (district)
- **Property Category** on inventory matches opportunity preference (or preference blank)
- **Property Type** on inventory matches opportunity preference (or preference blank)

Implementation today: `lib/matchOffers.ts` — **to be updated** when `property_category` / `property_type` columns exist. Current code uses legacy `workspace_type` → `offer_type` mapping (office-biased).

## Scoring rules (max 100) — category-agnostic metrics

| Criterion | Points | Pass condition |
|-----------|--------|----------------|
| Property Category | Hard filter | Exact match or opportunity preference empty |
| Property Type | Hard filter | Exact match or opportunity preference empty |
| Budget max | 25 | Rent or sale price ≤ budget max |
| Area | 20 | Net area within tolerance |
| Capacity | 20 | Capacity ≥ required (neutral if N/A for category) |
| District | 20 | District in preference list |
| Move-in | 15 | Available by move-in date |
| Available status | 10 | Offer status available |

Unspecified soft criteria add small neutral points so sparse requirements still return candidates.

**Threshold:** score **≥ 25** after category/type filter, sorted descending.

## Opportunity preference fields (target)

| Field | Example |
|-------|---------|
| Property Category | `Office`, `Retail`, `Office, Serviced Office` |
| Property Type | `Whole Floor`, `Shop`, `Any` |

Deprecates `workspace_type` after migration.

## Legacy workspace mapping (current code — remove after inventory finalisation)

| Opportunity workspace type | Legacy allowed offer types |
|---------------------------|---------------------------|
| Whole floor | Floor, Enbloc |
| Serviced office | Serviced Office |
| … | … |

Do not extend this table for new categories — use Property Category on inventory instead.

## District preference

Comma/semicolon separated; case-insensitive match on `buildings.district`.

## Proposals (future)

- Shortlist only includes offers whose inventory **Property Category** and **Property Type** match the opportunity (unless broker overrides manually later).
- Proposal PDF snapshots category/type on each line item.

## UI

- `/admin/opportunities/[id]` — matched offers table
- Opportunity form — Property Category & Property Type preference pickers (target)

## Not in scope (yet)

- Shortlist junction table
- Proposal PDF
- Per-category custom scoring weights (optional later)

## Future enhancements

1. Shortlist — `opportunity_offers`  
2. Listing intent filter (lease vs sale) on opportunity  
3. Configurable area tolerance  
4. Proposal generator after shortlist stable  
