# Cursor continuation handover

Handover date: 10 August 2026

## Start here

This repository contains the upgraded Noosphere CRM release candidate. Continue by fine-tuning the existing implementation; do not rebuild the application or replace its data model.

Read these documents before changing code:

1. `docs/SYSTEM-HANDOVER.md`
2. `docs/DATA-DICTIONARY.md`
3. `docs/import/production-to-upgraded-crm-migration.md`
4. `docs/DEPLOYMENT-CHECKLIST.md`
5. `docs/CHANGELOG.md`

## Repository safety

The current working tree intentionally contains the completed CRM upgrade across many modified and new files. Treat every existing change as user-owned release work.

- Do not run `git reset --hard`, discard files, restore the old project, or delete untracked files.
- Do not rebuild from the old production CRM.
- Inspect the diff before editing overlapping files.
- Freeze this state into a reviewed release commit/tag before production deployment.
- Develop and test against a non-production database.

## Current verified state

- `npm run build` passes on 10 August 2026.
- Next.js reports only existing workspace-root and middleware-convention warnings.
- The application runs on port `3001`.
- Database migrations are registered through Phase 71 in `scripts/migrate.ts`.
- Single administrative login remains intentional for this release.
- IMAP ingestion, multi-user access and production AI integrations remain deferred.

## Product model to preserve

Noosphere is a relationship-led real-estate intelligence CRM for a small operating team. Its essential connected records are:

- Leads that can qualify into Company, Contact and Opportunity
- Company and Contact referral hierarchies
- Buildings containing transactable Premises
- Opportunities connecting client requirements, parties, proposed premises, documents and activity footprints
- Activities as timestamped business history

Keep data input light. Do not introduce unnecessary legal, industrial or operational taxonomies.

## Opportunity workspace — latest layout

The latest fine-tuning work is concentrated in:

- `components/admin/opportunities/OpportunityWorkspaceHeader.tsx`
- `components/admin/opportunities/OpportunityCommercialHeader.tsx`
- `components/admin/opportunities/OpportunityOverviewTab.tsx`
- `components/admin/opportunities/OpportunityOverviewFields.tsx`
- `components/admin/opportunities/OpportunityRequirementSection.tsx`
- `components/admin/opportunities/OpportunityCurrentPosition.tsx`

Header:

- Opportunity Name
- Company and Contact directly beneath the name
- Opportunity Monitoring panel: Status, derived Probability and Expected Close
- Indicative Value is intentionally absent

Overview:

1. Client — Company, Contact, Lead/Opp Source, Owner, Transaction
2. Requirement — structured fields and Paste Requirements
3. AI — Current Position and expandable SWOT

Responsive rules:

- Wide desktop: three columns
- Tablet: Client spans the top; Requirement and AI below
- Mobile: Client, Requirement and AI stack vertically
- Avoid horizontal scrolling and avoid restoring duplicate Client fields to the header

Opportunity stages are `qualifying`, `sourcing`, `proposal_reviewing`, `negotiating`, `closed_won` and `closed_lost`. Probability is derived from status. Lead/Opp Source is Direct, Partner Agents or eMarketing.

## Fine-tuning boundaries

Safe next work includes spacing, typography, colour balance, responsive polish, accessibility and removal of genuine visual duplication.

Before changing fields, relationships, import columns, status values or database structure:

1. Check the data dictionary and import adapters.
2. Preserve aliases for production CSV compatibility.
3. Add an idempotent migration if storage changes.
4. Run the relevant import/schema verification.
5. Update this handover and the changelog.

## Verification after each change

Minimum:

```bash
npm run build
```

Before deployment:

```bash
npm run verify:import-lookup-fields
npm run verify:import-export-schema
```

Also inspect desktop and approximately 390px mobile views for Dashboard, Opportunity, Properties, Company, Contact and Channel Tree. Confirm drawers do not hide the mobile bottom navigation.

## Deployment and data migration

Do not deploy by exporting the new empty template and blindly re-importing production data. Follow `docs/import/production-to-upgraded-crm-migration.md`:

1. Freeze and tag the release.
2. Back up production PostgreSQL and export production CSVs.
3. Deploy code and run migrations.
4. Validate schema and principal pages.
5. Reconcile records using business IDs/external references.
6. Export from the upgraded system, enrich missing current fields, then update-import with IDs preserved.
7. Compare counts and archive a post-deployment export.

Never use a production database as the local development database.

## Deferred features

- IMAP incoming and sent-email ingestion, opt-out handling and AI lead digestion
- Multiple authenticated users and owner-scoped access
- Multiple AI/virtual sales staff and channel-specific outbound email
- Production AI translation, extraction, summarisation and follow-up automation
- Town Planning API zoning, land and site integration

These items are product direction, not unfinished requirements for the release deployment.
