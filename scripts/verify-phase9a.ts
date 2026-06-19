import "./ensure-env";
import { query } from "../lib/db";

async function main(): Promise<void> {
  const tables = await query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('properties', '_deprecated_sites', 'assets', 'inventory', 'buildings')
     ORDER BY table_name`,
  );
  console.log("Tables:", tables.map((t) => t.table_name).join(", "));

  const legacyCols = await query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = '_deprecated_sites'
     ORDER BY ordinal_position`,
  );
  console.log("_deprecated_sites has name_en:", legacyCols.some((c) => c.column_name === "name_en"));

  const propCols = await query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'properties'
     ORDER BY ordinal_position`,
  );
  console.log("properties has building_id:", propCols.some((c) => c.column_name === "building_id"));
  console.log("properties column count:", propCols.length);

  const counts = await query<{ label: string; n: string }>(
    `SELECT '_deprecated_sites' AS label, COUNT(*)::text AS n FROM _deprecated_sites
     UNION ALL SELECT 'properties', COUNT(*)::text FROM properties
     UNION ALL SELECT 'assets', COUNT(*)::text FROM assets
     UNION ALL SELECT 'inventory', COUNT(*)::text FROM inventory
     UNION ALL SELECT 'buildings', COUNT(*)::text FROM buildings`,
  );
  for (const row of counts) {
    console.log(`count ${row.label}:`, row.n);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
