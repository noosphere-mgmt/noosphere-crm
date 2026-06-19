import "./ensure-env";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { query } from "../lib/db";

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

  const migratePhase9a = await readSql("schema-migrate-phase9a-properties.sql");
  await query(migratePhase9a);
  console.log("Phase 9a properties table applied.");

  const migratePhase9c = await readSql("schema-migrate-phase9c-property-view-fields.sql");
  await query(migratePhase9c);
  console.log("Phase 9c property view fields applied.");

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

  console.log("Database migration completed.");
}

main().catch((err) => {
  console.error("Database migration failed:", err);
  process.exit(1);
});
