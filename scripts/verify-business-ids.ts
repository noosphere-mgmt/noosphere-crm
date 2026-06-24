/**
 * Verify permanent business IDs are populated and consistent.
 * Usage: npm run verify:business-ids
 */
import "./ensure-env";
import { query } from "../lib/db";
import { resolveBusinessId } from "../lib/businessIdResolve";

async function assert(condition: boolean, message: string): Promise<void> {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const companies = await query<{ company_id: string; business_id: string | null; operator: string | null }>(
    `SELECT cv.company_id, cv.business_id,
            (SELECT operator_company_id FROM properties_v1 p WHERE p.operator_company_id = cv.business_id LIMIT 1) AS operator
     FROM companies_v1 cv
     ORDER BY cv.business_id
     LIMIT 5`,
  );

  for (const row of companies) {
    await assert(Boolean(row.business_id?.startsWith("C")), `company missing business_id: ${row.company_id}`);
    if (row.operator) {
      await assert(row.operator === row.business_id, `operator FK not business_id for ${row.company_id}`);
    }
    const resolved = await resolveBusinessId("company", row.company_id);
    await assert(resolved === row.business_id, `resolver failed for ${row.company_id}`);
    const legacy = await query<{ legacy_company_id: number }>(
      `SELECT legacy_company_id::int AS legacy_company_id FROM companies_v1 WHERE company_id = $1`,
      [row.company_id],
    );
    if (legacy[0]?.legacy_company_id != null) {
      const fromLegacy = await resolveBusinessId("company", String(legacy[0].legacy_company_id));
      await assert(fromLegacy === row.business_id, `legacy resolver failed for ${row.company_id}`);
    }
  }

  const dupes = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM (
       SELECT business_id FROM business_id_crosswalk GROUP BY business_id HAVING COUNT(*) > 1
     ) d`,
  );
  await assert(dupes[0]?.n === "0", "duplicate business_id in crosswalk");

  console.log("verify-business-ids: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
