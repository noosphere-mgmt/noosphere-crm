/**
 * Regression: contacts import must treat "|" in display_name as plain text.
 * Natural keys join with an internal delimiter; pipe must not split display_name.
 *
 * Run: npm run verify:contacts-import-pipe
 */
import assert from "node:assert/strict";
import { contactsImportDefinition } from "../lib/import/adapters/contacts";
import { parseBigIntParam } from "../lib/import/fkValidation";
import { buildNaturalKeyParts, splitNaturalKeyParts } from "../lib/import/matchRecord";
import { normalizeKey } from "../lib/import/normalize";
import { parseCsv } from "../lib/import/parseCsv";

const DISPLAY_NAME = "Anson Tong | 唐卓越";
const COMPANY_ID = "42";

const FAILING_NAMES = [
  "Anson Tong | 唐卓越",
  "Hung | 洪健帅",
  "Jily | 徐小姐",
  "Lisa Li | 李旭影",
];

function assertNaturalKeyRoundTrip(displayName: string, companyId: string) {
  const built = contactsImportDefinition.buildNaturalKey({
    display_name: displayName,
    company_id: companyId,
  });
  assert.equal(built.ok, true, `natural key should build for ${displayName}`);

  const parts = splitNaturalKeyParts(built.key, 2);
  assert.ok(parts, `splitNaturalKeyParts must succeed for ${displayName}`);
  const [name, companyPart] = parts!;
  assert.equal(name, normalizeKey(displayName));
  assert.equal(companyPart, normalizeKey(companyId));

  const companyIdNum = parseBigIntParam(companyPart);
  assert.equal(companyIdNum, Number.parseInt(companyId, 10));
  assert.notEqual(companyIdNum, Number.NaN);
  assert.ok(Number.isFinite(companyIdNum!));
}

function assertCsvPreservesPipe() {
  const csv = [
    "display_name,company_id,email",
    `"${DISPLAY_NAME}",${COMPANY_ID},test@example.com`,
  ].join("\n");
  const parsed = parseCsv(csv);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0]!.display_name, DISPLAY_NAME);
  assert.equal(parsed.rows[0]!.company_id, COMPANY_ID);
}

function assertOldPipeSplitWouldBreak(displayName: string, companyId: string) {
  const legacyKey = buildNaturalKeyParts([displayName, companyId]).replace(/\x1f/g, "|");
  const naive = legacyKey.split("|");
  if (displayName.includes("|")) {
    assert.ok(
      naive.length > 2,
      `legacy pipe split must over-segment "${displayName}" (got ${naive.length} parts)`,
    );
    const wrongCompanyPart = naive[naive.length - 2]!;
    assert.notEqual(
      normalizeKey(wrongCompanyPart),
      normalizeKey(companyId),
      "naive split must mis-assign company_id when display_name contains pipe",
    );
  }
}

function main() {
  assertCsvPreservesPipe();

  for (const name of FAILING_NAMES) {
    assertNaturalKeyRoundTrip(name, COMPANY_ID);
    assertOldPipeSplitWouldBreak(name, COMPANY_ID);
  }

  assert.equal(parseBigIntParam("唐卓越"), null);
  assert.equal(parseBigIntParam(Number.NaN), null);
  assert.notEqual(String(parseBigIntParam("唐卓越") ?? ""), "NaN");

  console.log("verify-contacts-import-pipe: OK");
}

main();
