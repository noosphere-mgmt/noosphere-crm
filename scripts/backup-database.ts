import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import "./ensure-env";
import { requireNoosphereDatabaseUrl } from "../lib/databaseUrl";

function main(): void {
  const databaseUrl = requireNoosphereDatabaseUrl();
  const root = path.resolve(__dirname, "..");
  const backupDir = process.env.BACKUP_DIR?.trim() || path.join(root, "backups");
  mkdirSync(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const out = path.join(backupDir, `noosphere-${stamp}.dump`);

  console.log(`Backing up to ${out} ...`);
  const result = spawnSync("pg_dump", [databaseUrl, "--format=custom", `--file=${out}`], {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    console.error("pg_dump failed. Install PostgreSQL client tools and verify NOOSPHERE_DATABASE_URL.");
    process.exit(result.status ?? 1);
  }

  console.log("Done. Restore with:");
  console.log(`  pg_restore --clean --if-exists --dbname="$NOOSPHERE_DATABASE_URL" "${out}"`);
}

main();
