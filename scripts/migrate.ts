import "./ensure-env";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { query } from "../lib/db";
import { verifyBuildingsPageSchema } from "./migrate-post-verify";

async function readSql(name: string): Promise<string> {
  return readFile(path.join(__dirname, name), "utf8");
}

async function main(): Promise<void> {
  const migratePhase1 = await readSql("schema-migrate-phase1.sql");
  const migratePhase2 = await readSql("schema-migrate-phase2.sql");
  const schema = await readSql("schema.sql");

  await query(migratePhase1);
  console.log("Phase 1 data migration step finished.");

  const migratePhase0 = await readSql("schema-migrate-phase0-safe-columns.sql");
  await query(migratePhase0);
  console.log("Phase 0 safe columns applied.");

  await query(schema);
  console.log("Schema apply finished.");

  const migratePhase9a = await readSql("schema-migrate-phase9a-properties.sql");
  await query(migratePhase9a);
  console.log("Phase 9a properties table applied.");

  const migratePhase9c = await readSql("schema-migrate-phase9c-property-view-fields.sql");
  await query(migratePhase9c);
  console.log("Phase 9c property view fields applied.");

  await query(migratePhase2);
  console.log("Phase 2 schema fields applied.");

  const migratePhase3 = await readSql("schema-migrate-phase3-assets.sql");
  await query(migratePhase3);
  console.log("Phase 3 asset layer applied.");

  const migratePhase4 = await readSql("schema-migrate-phase4-building-root.sql");
  await query(migratePhase4);
  console.log("Phase 4 building root merge applied.");

  const migratePhase5 = await readSql("schema-migrate-phase5-opportunities.sql");
  await query(migratePhase5);
  console.log("Phase 5 opportunities applied.");

  const migratePhase6 = await readSql("schema-migrate-phase6-crm1.sql");
  await query(migratePhase6);
  console.log("Phase 6 CRM-1 applied.");

  const migratePhase7 = await readSql("schema-migrate-phase7-import-iw1.sql");
  await query(migratePhase7);
  console.log("Phase 7 Import IW-1 applied.");

  const migratePhase8 = await readSql("schema-migrate-phase8-inventory-company-links.sql");
  await query(migratePhase8);
  console.log("Phase 8 inventory company links applied.");

  const migratePhase10 = await readSql("schema-migrate-phase10-v1.sql");
  await query(migratePhase10);
  console.log("Phase 10 v1 properties module applied.");

  const migratePhase10b = await readSql("schema-migrate-phase10b-property-building-fields.sql");
  await query(migratePhase10b);
  console.log("Phase 10b property building fields applied.");

  const migratePhase10c = await readSql("schema-migrate-phase10c-property-company-links.sql");
  await query(migratePhase10c);
  console.log("Phase 10c property company links applied.");

  const migratePhase31Early = await readSql("schema-migrate-phase31-buildings-module-reconciliation.sql");
  await query(migratePhase31Early);
  console.log("Phase 31 (early) buildings module reconciliation applied.");

  const migratePhase10d = await readSql("schema-migrate-phase10d-premises-fields.sql");
  await query(migratePhase10d);
  console.log("Phase 10d premises fields applied.");

  const migratePhase10e = await readSql("schema-migrate-phase10e-premises-commercial.sql");
  await query(migratePhase10e);
  console.log("Phase 10e premises commercial fields applied.");

  const migratePhase10f = await readSql("schema-migrate-phase10f-premises-fit-out.sql");
  await query(migratePhase10f);
  console.log("Phase 10f premises fit-out applied.");

  const migratePhase11 = await readSql("schema-migrate-phase11-connections.sql");
  await query(migratePhase11);
  console.log("Phase 11 connections module applied.");

  const migratePhase12 = await readSql("schema-migrate-phase12-coverage.sql");
  await query(migratePhase12);
  console.log("Phase 12 coverage rename applied.");

  const migratePhase13 = await readSql("schema-migrate-phase13-connections-ui.sql");
  await query(migratePhase13);
  console.log("Phase 13 connections UI fields applied.");

  const migratePhase14 = await readSql("schema-migrate-phase14-company-name-cn.sql");
  await query(migratePhase14);
  console.log("Phase 14 company name CN applied.");

  const migratePhase15 = await readSql("schema-migrate-phase15-contact-relationships.sql");
  await query(migratePhase15);
  console.log("Phase 15 contact relationships applied.");

  const migratePhase16 = await readSql("schema-migrate-phase16-contact-role.sql");
  await query(migratePhase16);
  console.log("Phase 16 contact role applied.");

  const migratePhase17 = await readSql("schema-migrate-phase17-opportunity-lead-type.sql");
  await query(migratePhase17);
  console.log("Phase 17 opportunity lead type applied.");

  const migratePhase18 = await readSql("schema-migrate-phase18-opportunity-workspace.sql");
  await query(migratePhase18);
  console.log("Phase 18 opportunity workspace applied.");

  const migratePhase19 = await readSql("schema-migrate-phase19-opportunity-party-fees.sql");
  await query(migratePhase19);
  console.log("Phase 19 opportunity party fees applied.");

  const migratePhase20 = await readSql("schema-migrate-phase20-opportunity-sales-role.sql");
  await query(migratePhase20);
  console.log("Phase 20 opportunity sales role applied.");

  const migratePhase21 = await readSql("schema-migrate-phase21-opportunity-refinements.sql");
  await query(migratePhase21);
  console.log("Phase 21 opportunity refinements applied.");

  const migratePhase22 = await readSql("schema-migrate-phase22-opportunity-source-text.sql");
  await query(migratePhase22);
  console.log("Phase 22 opportunity source text applied.");

  const migratePhase23 = await readSql("schema-migrate-phase23-relationships.sql");
  await query(migratePhase23);
  console.log("Phase 23 relationships applied.");

  const migratePhase24 = await readSql("schema-migrate-phase24-activities-module.sql");
  await query(migratePhase24);
  console.log("Phase 24 activities module applied.");

  const migratePhase25 = await readSql("schema-migrate-phase25-activity-premises.sql");
  await query(migratePhase25);
  console.log("Phase 25 activity premises checkpoints applied.");

  const migratePhase26 = await readSql("schema-migrate-phase26-relationship-pairs.sql");
  await query(migratePhase26);
  console.log("Phase 26 relationship pairs applied.");

  const migratePhase27 = await readSql("schema-migrate-phase27-import-workbench.sql");
  await query(migratePhase27);
  console.log("Phase 27 import workbench expansion applied.");

  const migratePhase29 = await readSql("schema-migrate-phase29-properties-module-schema-alignment.sql");
  await query(migratePhase29);
  console.log("Phase 29 properties module schema alignment applied.");

  const migratePhase31 = await readSql("schema-migrate-phase31-buildings-module-reconciliation.sql");
  await query(migratePhase31);
  console.log("Phase 31 buildings module reconciliation applied.");

  const migratePhase32 = await readSql("schema-migrate-phase32-import-export-schema-alignment.sql");
  await query(migratePhase32);
  console.log("Phase 32 import/export schema alignment applied.");

  const migratePhase33 = await readSql("schema-migrate-phase33-property-v1-company-fk-text.sql");
  await query(migratePhase33);
  console.log("Phase 33 property v1 company FK text alignment applied.");

  const migratePhase34 = await readSql("schema-migrate-phase34-business-ids.sql");
  await query(migratePhase34);
  console.log("Phase 34 permanent business IDs applied.");

  const migratePhase35 = await readSql("schema-migrate-phase35-premises-relationship-lines-jsonb.sql");
  await query(migratePhase35);
  console.log("Phase 35 premises relationship_lines JSONB cleanup applied.");

  const migratePhase36 = await readSql("schema-migrate-phase36-contact-company-affiliations.sql");
  await query(migratePhase36);
  console.log("Phase 36 contact company affiliations applied.");

  const migratePhase37 = await readSql("schema-migrate-phase37-contact-locate-at.sql");
  await query(migratePhase37);
  console.log("Phase 37 contact locate_at applied.");

  const migratePhase38 = await readSql("schema-migrate-phase38-premises-category.sql");
  await query(migratePhase38);
  console.log("Phase 38 premises classification applied.");

  const migratePhase39 = await readSql("schema-migrate-phase39-opportunity-preferences.sql");
  await query(migratePhase39);
  console.log("Phase 39 opportunity preferences applied.");

  const migratePhase42 = await readSql("schema-migrate-phase42-matching-indexes.sql");
  await query(migratePhase42);
  console.log("Phase 42 matching indexes applied.");

  const migratePhase43 = await readSql("schema-migrate-phase43-opportunity-proposals.sql");
  await query(migratePhase43);
  console.log("Phase 43 opportunity proposals applied.");

  const migratePhase44 = await readSql("schema-migrate-phase44-proposal-pricing.sql");
  await query(migratePhase44);
  console.log("Phase 44 proposal pricing snapshots applied.");

  const migratePhase45 = await readSql("schema-migrate-phase45-opportunity-status-model.sql");
  await query(migratePhase45);
  console.log("Phase 45 opportunity status model applied.");

  const migratePhase46 = await readSql("schema-migrate-phase46-opportunity-status-simplify.sql");
  await query(migratePhase46);
  console.log("Phase 46 opportunity status simplify applied.");

  const migratePhase47 = await readSql("schema-migrate-phase47-proposed-premises-status.sql");
  await query(migratePhase47);
  console.log("Phase 47 proposed premises status simplify applied.");

  const migratePhase48 = await readSql("schema-migrate-phase48-referring-agent-role.sql");
  await query(migratePhase48);
  console.log("Phase 48 referring agent role cleanup applied.");

  const migratePhase49 = await readSql("schema-migrate-phase49-opportunity-documents.sql");
  await query(migratePhase49);
  console.log("Phase 49 opportunity documents applied.");

  const migratePhase50 = await readSql("schema-migrate-phase50-building-proposal-content.sql");
  await query(migratePhase50);
  console.log("Phase 50 building proposal content applied.");

  const migratePhase51 = await readSql("schema-migrate-phase51-premises-industry-model.sql");
  await query(migratePhase51);
  console.log("Phase 51 premises industry model applied.");

  const migratePhase52 = await readSql("schema-migrate-phase52-premises-management-fee-psf.sql");
  await query(migratePhase52);
  console.log("Phase 52 premises management fee PSF applied.");

  const migratePhase53 = await readSql("schema-migrate-phase53-premises-overview-fields.sql");
  await query(migratePhase53);
  console.log("Phase 53 premises overview and commission fields applied.");

  const migratePhase54 = await readSql("schema-migrate-phase54-generated-premises-name.sql");
  await query(migratePhase54);
  console.log("Phase 54 generated English premises names applied.");

  const migratePhase55 = await readSql("schema-migrate-phase55-premises-area-conversion.sql");
  await query(migratePhase55);
  console.log("Phase 55 premises area conversion backfill applied.");

  const migratePhase56 = await readSql("schema-migrate-phase56-premises-language-listing.sql");
  await query(migratePhase56);
  console.log("Phase 56 premises language and listing defaults applied.");

  const migratePhase57 = await readSql("schema-migrate-phase57-premises-offer-taxonomy.sql");
  await query(migratePhase57);
  console.log("Phase 57 premises offer taxonomy defaults applied.");

  const migratePhase58 = await readSql("schema-migrate-phase58-editable-generated-premises-name.sql");
  await query(migratePhase58);
  console.log("Phase 58 editable generated premises names applied.");

  const migratePhase59 = await readSql("schema-migrate-phase59-remove-payer-commission-fields.sql");
  await query(migratePhase59);
  console.log("Phase 59 payer-specific commission fields removed.");

  const migratePhase60 = await readSql("schema-migrate-phase60-premises-source-default.sql");
  await query(migratePhase60);
  console.log("Phase 60 premises source default applied.");

  const migratePhase61 = await readSql("schema-migrate-phase61-premises-date-defaults.sql");
  await query(migratePhase61);
  console.log("Phase 61 premises date defaults applied.");

  const migratePhase62 = await readSql("schema-migrate-phase62-generated-chinese-premises-names.sql");
  await query(migratePhase62);
  console.log("Phase 62 generated Chinese premises names applied.");

  const migratePhase63 = await readSql("schema-migrate-phase63-building-relationships.sql");
  await query(migratePhase63);
  console.log("Phase 63 building relationships applied.");

  const migratePhase64 = await readSql("schema-migrate-phase64-building-proposal-facilities-languages.sql");
  await query(migratePhase64);
  console.log("Phase 64 building proposal facilities languages applied.");

  const migratePhase65 = await readSql("schema-migrate-phase65-building-type.sql");
  await query(migratePhase65);
  console.log("Phase 65 building type applied.");

  const migratePhase66 = await readSql("schema-migrate-phase66-leads.sql");
  await query(migratePhase66);
  console.log("Phase 66 email leads inbox applied.");

  const migratePhase67 = await readSql("schema-migrate-phase67-email-config.sql");
  await query(migratePhase67);
  console.log("Phase 67 email configuration applied.");
  const migratePhase68 = await readSql("schema-migrate-phase68-crm-users.sql");
  await query(migratePhase68);
  console.log("Phase 68 CRM users and virtual staff applied.");

  const migratePhase69 = await readSql("schema-migrate-phase69-premises-space-form.sql");
  await query(migratePhase69);
  console.log("Phase 69 premises space form values standardized.");

  const migratePhase70 = await readSql("schema-migrate-phase70-premises-source-direct.sql");
  await query(migratePhase70);
  console.log("Phase 70 premises source type default standardized.");

  const migratePhase71 = await readSql("schema-migrate-phase71-opportunity-lifecycle-source.sql");
  await query(migratePhase71);
  console.log("Phase 71 opportunity lifecycle and source standardized.");

  const migratePhase72 = await readSql("schema-migrate-phase72-leads-requirement-fields.sql");
  await query(migratePhase72);
  console.log("Phase 72 leads requirement fields and source alignment applied.");

  const migratePhase73 = await readSql("schema-migrate-phase73-contact-phone-mobile-area.sql");
  await query(migratePhase73);
  console.log("Phase 73 contact phone/mobile and area codes applied.");

  const migratePhase74 = await readSql("schema-migrate-phase74-serviced-office-package-pricing.sql");
  await query(migratePhase74);
  console.log("Phase 74 serviced/shared office package pricing applied.");

  const migratePhase75 = await readSql("schema-migrate-phase75-company-office-address.sql");
  await query(migratePhase75);
  console.log("Phase 75 company office address applied.");

  const migratePhase76 = await readSql("schema-migrate-phase76-serviced-office-offers-annual-rent.sql");
  await query(migratePhase76);
  console.log("Phase 76 serviced/shared office offers + annual rent applied.");

  const migratePhase77 = await readSql("schema-migrate-phase77-premises-centre-status.sql");
  await query(migratePhase77);
  console.log("Phase 77 premises centre status applied.");

  const migratePhase78 = await readSql("schema-migrate-phase78-opportunity-commission.sql");
  await query(migratePhase78);
  console.log("Phase 78 opportunity commission applied.");


  const crosswalkCompanies = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM business_id_crosswalk WHERE entity_type = 'company'`,
  );
  const companyCrosswalkCount = Number.parseInt(crosswalkCompanies[0]?.n ?? "0", 10);
  if (companyCrosswalkCount > 0) {
    console.log(
      `Business ID crosswalk already populated (${companyCrosswalkCount} companies) — skipping populate step.`,
    );
  } else {
    const { runPopulateBusinessIds } = await import("./populate-business-ids");
    await runPopulateBusinessIds();
    console.log("Business ID population finished.");
  }

  await verifyBuildingsPageSchema();
  console.log("Post-migrate Buildings page schema verification passed.");

  console.log("Database migration completed.");
}

main().catch((err) => {
  console.error("Database migration failed:", err);
  process.exit(1);
});
