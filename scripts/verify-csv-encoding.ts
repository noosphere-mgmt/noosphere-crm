/**
 * Verify UTF-8 BOM CSV export/import roundtrip for Chinese text.
 * Run: npx ts-node -r tsconfig-paths/register --compiler-options '{"module":"CommonJS"}' scripts/verify-csv-encoding.ts
 */
import assert from "node:assert/strict";
import {
  CSV_UTF8_BOM,
  buildCsvContent,
  csvResponseBody,
  decodeCsvUtf8,
  stripCsvBom,
  withCsvBom,
} from "../lib/csvEncoding";
import { parseCsv } from "../lib/import/parseCsv";
import {
  IMPORT_SOURCE_SYSTEM_DEFAULT,
  resolveImportSessionMetadata,
} from "../lib/import/sessionMetadata";

const TRADITIONAL = "創紀之城－東亞銀行大廈";
const SIMPLIFIED = "创纪之城－东亚银行大厦";
const MIXED = "利園一期";

const headers = [
  "building_name_en",
  "building_name_zh",
  "building_name_cn",
  "company_name_zh",
  "company_name_cn",
  "contact_name_zh",
  "remarks",
];

const row = [
  "APM - BEA Tower",
  TRADITIONAL,
  SIMPLIFIED,
  TRADITIONAL,
  SIMPLIFIED,
  "陳大文",
  MIXED,
];

function main() {
  const body = buildCsvContent(headers, [row]);
  const exported = csvResponseBody(body);

  assert.ok(exported.startsWith(CSV_UTF8_BOM), "export must start with UTF-8 BOM");

  const bytes = new TextEncoder().encode(exported);
  assert.equal(bytes[0], 0xef);
  assert.equal(bytes[1], 0xbb);
  assert.equal(bytes[2], 0xbf);

  const decoded = decodeCsvUtf8(bytes.buffer);
  assert.equal(stripCsvBom(decoded), body);

  const parsed = parseCsv(decoded);
  assert.deepEqual(parsed.headers, headers);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0]!.building_name_zh, TRADITIONAL);
  assert.equal(parsed.rows[0]!.building_name_cn, SIMPLIFIED);
  assert.equal(parsed.rows[0]!.company_name_zh, TRADITIONAL);
  assert.equal(parsed.rows[0]!.company_name_cn, SIMPLIFIED);
  assert.equal(parsed.rows[0]!.contact_name_zh, "陳大文");
  assert.equal(parsed.rows[0]!.remarks, MIXED);

  const roundtrip = parseCsv(withCsvBom(body));
  assert.equal(roundtrip.rows[0]!.building_name_zh, TRADITIONAL);
  assert.equal(roundtrip.rows[0]!.building_name_cn, SIMPLIFIED);
  assert.equal(roundtrip.rows[0]!.remarks, MIXED);

  const meta = resolveImportSessionMetadata({
    filename: "buildings-export.csv",
    source_system: null,
    source_file: null,
    source_date: null,
  });
  assert.equal(meta.source_system, IMPORT_SOURCE_SYSTEM_DEFAULT);
  assert.equal(meta.source_file, "buildings-export.csv");
  assert.match(meta.source_date, /^\d{4}-\d{2}-\d{2}$/);

  console.log("CSV UTF-8 BOM roundtrip OK");
  console.log(`  Traditional: ${TRADITIONAL}`);
  console.log(`  Simplified:  ${SIMPLIFIED}`);
  console.log(`  Mixed:       ${MIXED}`);
}

main();
