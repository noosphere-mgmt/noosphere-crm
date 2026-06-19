# Property classification (Inventory & matching)

**Status:** Approved — property-type agnostic design  
**Applies to:** Property Portfolio (inventory), Opportunities, matching, proposals, import

---

## Principle

Inventory / Property Portfolio must **not** be modelled as office-only supply.

The schema uses two generic fields — not office-specific column names or enums tied to a single asset class.

| Field | Role |
|-------|------|
| **Property Category** | Top-level classification — what kind of property this is |
| **Property Type** | Secondary classification — physical or deal form (category-agnostic) |

Offers carry **commercial terms** (lease/sale, rent, availability). Category and type live on the **inventory record**, not duplicated as office-centric offer types.

---

## Property Category (top-level)

Controlled lookup — one value per inventory record.

| Value | Typical use |
|-------|-------------|
| **Office** | Traditional office lease/sale space |
| **Serviced Office** | Operator-managed office product |
| **Shared Office** | Coworking / hot desk |
| **Retail** | Shop, F&B, street frontage |
| **Industrial** | Warehouse, factory, industrial floor |
| **Residential** | Flat, house (where brokerage handles it) |
| **Hotel** | Hospitality floor / operator space |
| **Investment** | En-bloc, whole-building, investment sale |

**DB column (target):** `property_category` on inventory / `assets` (rename TBD).

---

## Property Type (secondary)

Describes **form** or **layout** — shared across categories.

Examples (not exhaustive):

| Property Type | Often used with category |
|---------------|--------------------------|
| Whole Floor | Office, Industrial, Hotel |
| Unit | Office, Retail, Residential |
| Suite | Office, Serviced Office |
| Room | Serviced Office, Shared Office, Hotel |
| Shop | Retail |
| Warehouse | Industrial |
| En-bloc | Investment, Office |
| Land | Investment, Industrial |
| Portfolio | Investment |

**DB column (target):** `property_type` on inventory (distinct from legacy building `property_type` and legacy `asset_type`).

**Rule:** Do not use office-only enums (e.g. `offer_type = Serviced Office`) as the primary classification — fold into **Property Category** on inventory.

---

## Opportunity requirements

Replace office-centric **workspace type** with:

| Field | Purpose |
|-------|---------|
| **Property Category** (preference) | Required filter for matching & proposals; comma-separated or multi-select allowed |
| **Property Type** (preference) | Optional finer filter (e.g. Whole Floor, Shop) |

Existing `workspace_type` → **deprecate** after migration to category + type preferences.

Area, capacity, district, budget remain cross-category (capacity applies mainly to office/hospitality; industrial may ignore with neutral score).

---

## Matching & proposals

### Hard filter (recommended)

When opportunity specifies Property Category, **exclude** inventory/offers where `property_category` does not match (unless preference is blank / “Any”).

When opportunity specifies Property Type, apply same rule against inventory `property_type`.

### Scoring (after filter)

Continue with budget, area, district, move-in, availability — category-agnostic metrics.

| Stage | Filter / score by |
|-------|-------------------|
| Candidate pool | Status available/proposed + **category match** + **type match** |
| Rank | Budget, area, capacity, district, dates |
| Proposal shortlist | Same category/type as opportunity requirement |
| Proposal PDF | Only pinned rows matching opportunity category/type |

See [offer-matching.md](./offer-matching.md).

---

## Legacy mapping (current codebase → target)

| Legacy | Target |
|--------|--------|
| `assets.asset_type` (Floor, Unit, …) | **Property Type** |
| `inventory.offer_type` (Serviced Office, …) | **Property Category** on inventory (offer keeps lease/sale terms only) |
| `opportunities.workspace_type` | **Property Category** + **Property Type** preference |
| `WORKSPACE_TYPES` lookup | Split into `PROPERTY_CATEGORIES` + `PROPERTY_TYPES` |
| `buildings.property_type` (Commercial Building) | Building use / address context — **not** inventory category |

---

## Import template columns (Inventory module)

Include at minimum:

- Property Category  
- Property Type  
- Building, Floor, Unit, Suite, District, Street  
- Area, Capacity  
- Landlord, Operator, Tenant (as applicable)  
- Status, Source, Remarks  

Full XLSX template — not office-only columns.

---

## What not to do

- Do not add retail/industrial/residential as separate database entities  
- Do not model HK land registry ownership chains  
- Do not require floor/unit hierarchy completeness  
- Do not hard-code matching rules only for `offer_type` / workspace type office maps  

One inventory table, two classification fields, filtered views in UI.
