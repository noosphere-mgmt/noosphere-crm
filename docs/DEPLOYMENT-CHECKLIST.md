# Production deployment checklist

## 1. Freeze and identify the release

- [ ] Stop feature changes.
- [ ] Review `git status` and include only intended CRM changes.
- [ ] Run `npm run build`.
- [ ] Run `npm run verify:import-lookup-fields`.
- [ ] Run `npm run verify:import-export-schema` against the release database.
- [ ] Commit the release and record the commit hash here: `________________`.
- [ ] Create the release tag (suggested: `v2.0-crm-intelligence`) and record it here: `________________`.

## 2. Back up production

- [ ] Create a PostgreSQL backup before any migration.
- [ ] Export the current production CSV package.
- [ ] Record production row counts for companies, contacts, buildings, premises, opportunities, parties, proposed premises, activities and relationships.
- [ ] Confirm the backup can be read and store a copy away from the VPS.

Backup time: `________________`  Backup location: `________________`

## 3. Check production configuration

- [ ] `NOOSPHERE_DATABASE_URL` points to production PostgreSQL.
- [ ] `ADMIN_TOKEN` is set and not committed to Git.
- [ ] Node, npm and PM2 are available.
- [ ] Port `3001` is available to the application/reverse proxy.
- [ ] The checked-out branch and commit match the frozen release.

## 4. Deploy

The repository deployment command is:

```bash
bash scripts/deploy-production.sh
```

It pulls the repository, installs packages, runs all migrations through Phase 71, removes the previous build, creates a production build, restarts the PM2 process and saves the PM2 configuration.

- [ ] Watch the migration output for errors.
- [ ] Confirm the production build completes before PM2 is replaced.
- [ ] Confirm PM2 process `noosphere-crm` is online.
- [ ] Confirm `/api/health` reports database connectivity.

## 5. Validate the application

- [ ] Login works.
- [ ] Noosphere Intelligence loads.
- [ ] Leads loads and a lead can be opened.
- [ ] Opportunity listing and one Opportunity workspace load.
- [ ] Opportunity header shows Name, Company/Contact and the Status/Probability/Expected Close monitoring panel.
- [ ] Opportunity Overview shows Client, Requirement and AI in three columns on a wide desktop.
- [ ] Parties retain Company and dependent Contact after another edit.
- [ ] Proposed premises search and suggested matches load.
- [ ] Documents can be viewed and deleted with confirmation.
- [ ] Buildings/Premises split page, flat premises listing and filters work.
- [ ] One Building and one Premises detail page load.
- [ ] Company, Contact and Channel Tree pages load and links open correctly.
- [ ] Activity timeline and inline Record Activity form work on all entity types.
- [ ] Import template download and export download work.
- [ ] Test mobile viewing for dashboard, opportunity, properties and connections.
- [ ] At approximately 390px, confirm Dashboard shows AI Copilot, Business Pulse, Pipeline and Referral Performance without horizontal scrolling.
- [ ] Confirm the mobile hamburger contains Leads, Opportunities, Buildings, Companies and Activities, and contains no administrative Settings.
- [ ] Confirm mobile Opportunity Overview stacks Client, Requirement and AI without horizontal overflow; Special Requirement remains full-width.
- [ ] Confirm mobile Opportunity Proposed displays premises cards (not the desktop table), selection works and Edit opens the line editor.
- [ ] Confirm the five-item bottom navigation remains visible above drawers and Opportunities is a direct link.

## 6. Migrate and enrich data

If the upgraded database does not already contain production data, use the dry-run workflow in [production-to-upgraded-crm-migration.md](import/production-to-upgraded-crm-migration.md). Do not import into production without reviewing duplicate candidates and reference errors.

After migration, export data from the upgraded system, fill missing current fields in those exports, and re-import using update matching by business ID. Never remove IDs from update files.

Export a fresh Building/Premises CSV after deployment and confirm structured relationship cells contain JSON rather than `[object Object]`. Do not attempt to recover relationship details from an older `[object Object]` export; re-export from the database-backed upgraded system.

## 7. Reconcile

- [ ] Compare post-migration counts with the recorded production counts.
- [ ] Review duplicate and unresolved-reference reports.
- [ ] Spot-check multilingual property names and addresses.
- [ ] Spot-check areas, rent, management fee, prices and dates.
- [ ] Confirm referral branches and opportunity counts.
- [ ] Export a complete post-deployment CSV package and archive it.

## Rollback

If migration or validation fails:

1. Stop the new PM2 process.
2. Restore the pre-deployment database backup.
3. Check out the previously recorded production commit/tag.
4. Install dependencies and rebuild that version.
5. Start PM2 and verify `/api/health` plus the principal pages.
6. Record the failure before attempting another deployment.

Do not attempt rollback by manually deleting new columns or selectively reversing migration SQL.
