import "./ensure-env";
import { query } from "../lib/db";

async function main(): Promise<void> {
  const legacyCounts = await query<{ name: string; n: string }>(
    `SELECT 'buildings' AS name, COUNT(*)::text AS n FROM buildings
     UNION ALL SELECT 'phase9_properties', COUNT(*)::text FROM properties
     UNION ALL SELECT 'companies', COUNT(*)::text FROM companies
     UNION ALL SELECT 'contacts', COUNT(*)::text FROM contacts
     UNION ALL SELECT 'opportunities', COUNT(*)::text FROM opportunities
     ORDER BY name`,
  );

  console.log("Legacy row counts:");
  for (const r of legacyCounts) console.log(`- ${r.name}: ${r.n}`);

  const v1Counts = await query<{ name: string; n: string }>(
    `SELECT 'properties_v1' AS name, COUNT(*)::text AS n FROM properties_v1
     UNION ALL SELECT 'premises_v1', COUNT(*)::text FROM premises_v1
     UNION ALL SELECT 'companies_v1', COUNT(*)::text FROM companies_v1
     UNION ALL SELECT 'contacts_v1', COUNT(*)::text FROM contacts_v1
     UNION ALL SELECT 'opportunities_v1', COUNT(*)::text FROM opportunities_v1
     ORDER BY name`,
  );

  console.log("\nV1 row counts:");
  for (const r of v1Counts) console.log(`- ${r.name}: ${r.n}`);

  const coverage = await query<Record<string, string>>(
    `SELECT 'buildings→properties_v1' AS name,
            (SELECT COUNT(*)::text FROM buildings) AS legacy,
            (SELECT COUNT(*)::text FROM properties_v1) AS v1,
            (SELECT COUNT(*)::text FROM properties_v1 WHERE legacy_building_id IS NOT NULL) AS mapped
     UNION ALL
     SELECT 'phase9_properties→premises_v1' AS name,
            (SELECT COUNT(*)::text FROM properties) AS legacy,
            (SELECT COUNT(*)::text FROM premises_v1) AS v1,
            (SELECT COUNT(*)::text FROM premises_v1 WHERE legacy_property_row_id IS NOT NULL) AS mapped
     ORDER BY name`,
  );

  console.log("\nMapping coverage:");
  for (const r of coverage) {
    console.log(`- ${r.name}: legacy=${r.legacy} v1=${r.v1} mapped=${r.mapped}`);
  }

  const requiredMissing = await query<Record<string, string>>(
    `SELECT 'properties_v1.full_address_en' AS field,
            COUNT(*)::text AS missing
     FROM properties_v1
     WHERE full_address_en IS NULL OR btrim(full_address_en) = ''
     UNION ALL
     SELECT 'premises_v1.property_name_en' AS field,
            COUNT(*)::text AS missing
     FROM premises_v1
     WHERE property_name_en IS NULL OR btrim(property_name_en) = ''`,
  );

  console.log("\nMissing required fields (v1):");
  for (const r of requiredMissing) console.log(`- ${r.field}: ${r.missing}`);

  const orphanPremises = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n
     FROM premises_v1 p
     LEFT JOIN properties_v1 h ON h.property_id = p.property_id
     WHERE h.property_id IS NULL`,
  );
  console.log(`\nOrphan premises (no header): ${orphanPremises[0]?.n ?? "0"}`);

  const sample = await query<Record<string, unknown>>(
    `SELECT
        h.property_id,
        h.bldg_name_en,
        h.district_en,
        h.full_address_en,
        p.premises_id,
        p.floor,
        p.unit,
        p.inventory_status,
        p.monthly_rent::text AS monthly_rent,
        p.available_date::text AS available_date,
        p.offer_type,
        p.operator_company_id
     FROM properties_v1 h
     JOIN premises_v1 p ON p.property_id = h.property_id
     ORDER BY h.property_id, p.premises_id
     LIMIT 10`,
  );

  console.log("\nSample joined records (properties_v1 ⋈ premises_v1):");
  console.log(JSON.stringify(sample, null, 2));
}

main().catch((err) => {
  console.error("Verify v1 failed:", err);
  process.exit(1);
});

