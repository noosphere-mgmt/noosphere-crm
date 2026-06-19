# Noosphere Real Estate

Internal brokerage CRM: **known supply** (property portfolio + offers), **companies/contacts**, **opportunities**, import, matching, and (future) proposals.

Not a Hong Kong-wide property database. See **[docs/product-direction.md](docs/product-direction.md)** for objectives, module fields, UI philosophy, and development priority.

- **Stack:** Next.js 16, PostgreSQL, raw SQL via `pg`
- **Database env:** `NOOSPHERE_DATABASE_URL` (separate from Office Directory)
- **Port:** 3001 (Office Directory uses 3000)

## Local setup

```bash
cp .env.example .env.local
# Edit NOOSPHERE_DATABASE_URL and optionally ADMIN_TOKEN

npm run db:migrate
npm run dev
```

Open http://localhost:3001/admin — dev login token defaults to `dev-admin`.

**Docs:** [Product direction](docs/product-direction.md) · [Company model](docs/company-model.md) · [Property classification](docs/property-classification.md) · [Glossary](docs/brokerage-model.md)

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Production server on port 3001 |
| `npm run db:migrate` | Apply `scripts/schema.sql` |
| `npm run typecheck` | TypeScript check |

## Health

`GET /api/health` — reports DB connectivity.

## Deploy (VPS)

```bash
bash scripts/deploy-production.sh
```

PM2 process name: `noosphere-realestate`, port **3001**.
