import "./ensure-env";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { query } from "../lib/db";

async function main(): Promise<void> {
  const phase10 = await readFile(path.join(__dirname, "schema-migrate-phase10-v1.sql"), "utf8");
  await query(phase10);
  console.log("Phase 10 v1 tables applied.");

  const phase10b = await readFile(path.join(__dirname, "schema-migrate-phase10b-property-building-fields.sql"), "utf8");
  await query(phase10b);
  console.log("Phase 10b property building fields applied.");

  const phase10c = await readFile(path.join(__dirname, "schema-migrate-phase10c-property-company-links.sql"), "utf8");
  await query(phase10c);
  console.log("Phase 10c property company links applied.");

  const phase10d = await readFile(path.join(__dirname, "schema-migrate-phase10d-premises-fields.sql"), "utf8");
  await query(phase10d);
  console.log("Phase 10d premises fields applied.");

  const phase10e = await readFile(path.join(__dirname, "schema-migrate-phase10e-premises-commercial.sql"), "utf8");
  await query(phase10e);
  console.log("Phase 10e premises commercial fields applied.");

  const phase10f = await readFile(path.join(__dirname, "schema-migrate-phase10f-premises-fit-out.sql"), "utf8");
  await query(phase10f);
  console.log("Phase 10f premises fit out condition applied.");
}

main().catch((err) => {
  console.error("V1 migration failed:", err);
  process.exit(1);
});

