/**
 * Audit and repair company references stored as names or legacy numeric IDs
 * instead of v1 company_id (COMP-YYYY-####).
 *
 * Usage:
 *   npx tsx scripts/load-env-cli.ts npx tsx scripts/audit-company-references.ts
 *   npx tsx scripts/load-env-cli.ts npx tsx scripts/audit-company-references.ts --fix
 */
import { query } from "../lib/db";
import {
  buildCompanyLookupMaps,
  isV1CompanyId,
  resolveToV1CompanyId,
  type CompanyResolveResult,
} from "../lib/companyIdResolve";
import { normalizeRelationshipLines } from "../lib/premisesRelationships";

const fix = process.argv.includes("--fix");

type PremisesRow = {
  premises_id: string;
  relationship_lines: unknown;
  operator_company_id: string | null;
  owner_company_id: string | null;
  landlord_company_id: string | null;
  current_tenant_company_id: string | null;
  source_company_id: string | null;
};

type PropertyRow = {
  property_id: string;
  management_company_id: string | null;
  operator_company_id: string | null;
  owner_company_id: string | null;
  current_tenant_company_id: string | null;
};

function report(results: CompanyResolveResult[]) {
  console.log("\nField\tRecord\tOld Value\tMatched ID\tStatus");
  console.log("-----\t------\t---------\t----------\t------");
  for (const r of results) {
    console.log(
      `${r.field}\t${r.recordId}\t${r.oldValue}\t${r.matchedCompanyId ?? "—"}\t${r.status}`,
    );
  }
  const unmatched = results.filter((r) => r.status === "unmatched");
  const fixed = results.filter((r) => r.status === "ok");
  console.log(`\nTotal: ${results.length} | Resolved: ${fixed.length} | Unmatched: ${unmatched.length}`);
}

async function main() {
  const [legacy, v1] = await Promise.all([
    query<{ id: number; company_name: string }>(`SELECT id::int AS id, company_name FROM companies`),
    query<{ company_id: string; company_name_en: string | null; legacy_company_id: number | null }>(
      `SELECT company_id, company_name_en, legacy_company_id::int AS legacy_company_id FROM companies_v1`,
    ),
  ]);
  const maps = buildCompanyLookupMaps(legacy, v1);
  const results: CompanyResolveResult[] = [];

  const auditField = (
    field: string,
    recordId: string,
    raw: string | null | undefined,
  ): string | null => {
    const oldValue = raw?.trim() ?? "";
    if (!oldValue) {
      results.push({ field, recordId, oldValue: "", matchedCompanyId: null, status: "empty" });
      return null;
    }
    if (isV1CompanyId(oldValue)) {
      results.push({ field, recordId, oldValue, matchedCompanyId: oldValue, status: "already_v1" });
      return oldValue;
    }
    const matched = resolveToV1CompanyId(oldValue, maps);
    if (matched) {
      results.push({ field, recordId, oldValue, matchedCompanyId: matched, status: "ok" });
      return matched;
    }
    results.push({ field, recordId, oldValue, matchedCompanyId: null, status: "unmatched" });
    return null;
  };

  const premises = await query<PremisesRow>(
    `SELECT premises_id, relationship_lines,
            operator_company_id, owner_company_id, landlord_company_id,
            current_tenant_company_id, source_company_id
     FROM premises_v1`,
  );

  for (const row of premises) {
    const cols = [
      ["operator_company_id", row.operator_company_id],
      ["owner_company_id", row.owner_company_id],
      ["landlord_company_id", row.landlord_company_id],
      ["current_tenant_company_id", row.current_tenant_company_id],
      ["source_company_id", row.source_company_id],
    ] as const;

    const patch: Record<string, string | null> = {};
    for (const [field, raw] of cols) {
      const resolved = auditField(`premises_v1.${field}`, row.premises_id, raw);
      if (fix && resolved && resolved !== raw) patch[field] = resolved;
    }

    let lines = Array.isArray(row.relationship_lines) ? row.relationship_lines : [];
    if (lines.length > 0) {
      const normalized = normalizeRelationshipLines(lines, maps);
      for (let i = 0; i < lines.length; i++) {
        const before = lines[i]?.company_id?.trim() ?? "";
        const after = normalized[i]?.company_id?.trim() ?? "";
        if (before && before !== after) {
          results.push({
            field: `premises_v1.relationship_lines[${i}].company_id`,
            recordId: row.premises_id,
            oldValue: before,
            matchedCompanyId: after || null,
            status: after ? "ok" : "unmatched",
          });
        }
      }
      if (fix) lines = normalized;
      if (fix && JSON.stringify(lines) !== JSON.stringify(row.relationship_lines)) {
        patch.relationship_lines = JSON.stringify(lines);
      }
    }

    if (fix && Object.keys(patch).length > 0) {
      const sets: string[] = [];
      const params: unknown[] = [row.premises_id];
      let i = 2;
      for (const [k, v] of Object.entries(patch)) {
        sets.push(`${k} = $${i}`);
        params.push(v);
        i++;
      }
      await query(`UPDATE premises_v1 SET ${sets.join(", ")} WHERE premises_id = $1`, params);
    }
  }

  const properties = await query<PropertyRow>(
    `SELECT property_id, management_company_id, operator_company_id, owner_company_id, current_tenant_company_id
     FROM properties_v1`,
  );

  for (const row of properties) {
    const patch: Record<string, string | null> = {};
    for (const [field, raw] of [
      ["management_company_id", row.management_company_id],
      ["operator_company_id", row.operator_company_id],
      ["owner_company_id", row.owner_company_id],
      ["current_tenant_company_id", row.current_tenant_company_id],
    ] as const) {
      const resolved = auditField(`properties_v1.${field}`, row.property_id, raw);
      if (fix && resolved && resolved !== raw) patch[field] = resolved;
    }
    if (fix && Object.keys(patch).length > 0) {
      const sets: string[] = [];
      const params: unknown[] = [row.property_id];
      let i = 2;
      for (const [k, v] of Object.entries(patch)) {
        sets.push(`${k} = $${i}`);
        params.push(v);
        i++;
      }
      await query(`UPDATE properties_v1 SET ${sets.join(", ")} WHERE property_id = $1`, params);
    }
  }

  const orphanOpps = await query<{ id: number; company_name: string | null; company_id: number | null }>(
    `SELECT id::int AS id, company_name, company_id::int AS company_id
     FROM opportunities
     WHERE company_id IS NULL AND company_name IS NOT NULL AND trim(company_name) <> ''`,
  );

  for (const row of orphanOpps) {
    const matchedLegacy = legacy.find(
      (c) => c.company_name.trim().toLowerCase() === (row.company_name ?? "").trim().toLowerCase(),
    );
    if (matchedLegacy) {
      results.push({
        field: "opportunities.company_id",
        recordId: String(row.id),
        oldValue: row.company_name ?? "",
        matchedCompanyId: String(matchedLegacy.id),
        status: "ok",
      });
      if (fix) {
        await query(`UPDATE opportunities SET company_id = $2 WHERE id = $1`, [row.id, matchedLegacy.id]);
      }
    } else {
      results.push({
        field: "opportunities.company_id",
        recordId: String(row.id),
        oldValue: row.company_name ?? "",
        matchedCompanyId: null,
        status: "unmatched",
      });
    }
  }

  report(results);
  if (fix) {
    console.log("\nApplied fixes where matches were found.");
  } else {
    console.log("\nDry run only. Re-run with --fix to apply updates.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
