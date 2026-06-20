# Admin viewport architecture

Separate **mobile** and **desktop** presentation trees prevent responsive refactors from breaking the other layout.

## Breakpoints

| Band | Width | Tailwind | Component tree |
|------|-------|----------|----------------|
| Mobile | &lt; 768px | default, hidden at `md:` | `*Mobile.tsx` |
| Tablet | 768–1023px | `md:`–`lg:` | **Desktop** (temporary) |
| Workstation | ≥ 1024px | `lg:`+ | **Desktop** |

Constants: `lib/adminViewport.ts`

Switch wrapper: `components/admin/layout/AdminViewportSwitch.tsx`

```tsx
<AdminViewportSwitch
  mobile={<PremisesMobile {...props} />}
  desktop={<PremisesDesktop {...props} />}
/>
```

- Mobile wrapper: `md:hidden`
- Desktop wrapper: `hidden md:block`

## Rules

1. **Data fetching stays in route `page.tsx` and `lib/repos/*`** — never duplicate queries in Mobile/Desktop files.
2. **Desktop** = full-width, dense tables, inline filters, bulk actions, workstation nav (`AdminShell` sidebar at `lg:`).
3. **Mobile** = compact toolbar, card lists, drawer detail, bottom nav.
4. **Do not** use `md:hidden` / `hidden lg:block` inside a shared list component to toggle layouts.
5. **Do not** stretch mobile cards on desktop or squeeze desktop tables on mobile.
6. Shared filter/sort state → hooks (`usePremisesFlatList`, `useConnectionsCompaniesList`, etc.) consumed by both trees.

## Page map

| Route | Desktop | Mobile | Shared hook / data |
|-------|---------|--------|-------------------|
| `/admin` | `DashboardDesktop` | `DashboardMobile` | `fetchDashboardData` |
| `/admin/properties` | `PremisesDesktop` | `PremisesMobile` | premises page server fetch |
| `/admin/properties/buildings` | `BuildingsDesktop` | `BuildingsMobile` | buildings page server fetch |
| `/admin/companies` | `ConnectionsCompaniesDesktop` | `ConnectionsCompaniesMobile` | `useConnectionsCompaniesList` |
| `/admin/contacts` | `ConnectionsContactsDesktop` | `ConnectionsContactsMobile` | `useConnectionsContactsList` |
| `/admin/opportunities` | `OpportunitiesDesktop` | `OpportunitiesMobile` | `useOpportunitiesList` |

## Adding UI to a priority page

1. Decide which viewport(s) change.
2. Edit **only** `XxxDesktop.tsx` or `XxxMobile.tsx`.
3. If both need new filtered fields, extend the shared hook and repo types first.
4. Run `npm run screenshots:admin` and commit PNGs under `docs/admin-screenshots/`.

## Screenshots

```bash
# Dev server on :3001, ADMIN_TOKEN in .env
npm run dev
npm run screenshots:admin
```

Outputs:

- `docs/admin-screenshots/mobile/` — 390px width
- `docs/admin-screenshots/desktop/` — 1440px width
