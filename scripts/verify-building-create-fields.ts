/**
 * Verify new-building address fields survive parse → insert → read-back.
 * Usage: npm run verify:building-create-fields
 */
import "./ensure-env";
import { parsePropertyV1Form } from "../lib/parsePropertyV1Form";
import { createPropertyV1, deletePropertiesV1, getPropertyV1 } from "../lib/repos/propertiesV1";

const EXPECTED = {
  bldg_name_en: "Verify Building Create Fields",
  city_en: "Hong Kong",
  district_en: "Central",
  street_no: "8",
  street_name_en: "Finance Street",
  country: "Hong Kong",
  full_address_en: "8 Finance Street, Central, Hong Kong",
} as const;

function buildFormData(): FormData {
  const fd = new FormData();
  fd.set("bldg_name_en", EXPECTED.bldg_name_en);
  fd.set("city_en", EXPECTED.city_en);
  fd.set("district_en", EXPECTED.district_en);
  fd.set("street_no", EXPECTED.street_no);
  fd.set("street_name_en", EXPECTED.street_name_en);
  fd.set("country", EXPECTED.country);
  return fd;
}

function assertField(label: string, actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function main(): Promise<void> {
  const patch = parsePropertyV1Form(buildFormData());
  for (const [key, value] of Object.entries(EXPECTED)) {
    assertField(`parsePropertyV1Form.${key}`, patch[key as keyof typeof patch], value);
  }

  const propertyId = await createPropertyV1(patch);
  try {
    const row = await getPropertyV1(propertyId);
    if (!row) throw new Error(`Building ${propertyId} not found after create`);

    for (const [key, value] of Object.entries(EXPECTED)) {
      assertField(`DB ${key}`, row[key as keyof typeof row], value);
    }
  } finally {
    await deletePropertiesV1([propertyId]);
  }

  console.log("verify-building-create-fields: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
