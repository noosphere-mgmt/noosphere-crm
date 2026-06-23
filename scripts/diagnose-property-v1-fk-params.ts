/**
 * Print live FK column types and full-form UPDATE parameter index map.
 * Usage: npm run diagnose:property-v1-fk-params
 */
import "./ensure-env";
import {
  fullFormParamIndex,
  getPropertyV1FkColumnTypes,
  PROPERTY_V1_FULL_FORM_UPDATE_PARAMS,
} from "../lib/propertyV1DbCoerce";

async function main(): Promise<void> {
  const types = await getPropertyV1FkColumnTypes();
  console.log("properties_v1 / premises_v1 company FK storage (public schema):\n");
  for (const [key, storage] of [...types.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${key}: ${storage}`);
  }

  console.log("\nFull building form UPDATE parameter map ($1 = property_id WHERE):\n");
  for (const column of PROPERTY_V1_FULL_FORM_UPDATE_PARAMS) {
    const idx = fullFormParamIndex(column);
    const storage =
      column.endsWith("_company_id") ? types.get(`properties_v1.${column}`) ?? "(unknown)" : "";
    const suffix = storage ? ` [${storage}]` : "";
    console.log(`  $${idx}  ${column}${suffix}`);
  }

  console.log(
    "\nWhen PostgreSQL reports invalid input for type bigint at $31 on a full building save, " +
      "the column is operator_company_id.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
