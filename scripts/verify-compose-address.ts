/**
 * Verify English address composition (Street no. Street, District, City).
 * Run: npm run verify:compose-address
 */
import { composeAddressEnglish, composePropertyFullAddresses, formatPropertyV1AddressEn } from "../lib/composeAddress";

function assertEqual(actual: string, expected: string, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected "${expected}", got "${actual}"`);
  }
}

function main() {
  assertEqual(
    composeAddressEnglish({
      streetNo: "41",
      streetName: "Connaught Road",
      district: "Central",
      city: "Hong Kong",
    }),
    "41 Connaught Road, Central, Hong Kong",
    "Nexxus-style address",
  );

  assertEqual(
    composeAddressEnglish({
      streetNo: "8",
      streetName: "Finance Street",
      district: "Central",
      city: "Hong Kong",
    }),
    "8 Finance Street, Central, Hong Kong",
    "One ifc-style address",
  );

  assertEqual(
    composeAddressEnglish({
      streetNo: "418",
      streetName: "Kwun Tong Road",
      district: "Kwun Tong",
      city: "Kowloon",
    }),
    "418 Kwun Tong Road, Kwun Tong, Kowloon",
    "Kwun Tong sample",
  );

  assertEqual(
    composeAddressEnglish({
      streetName: "Queen's Road Central",
      district: "Central",
      city: "Hong Kong",
    }),
    "Queen's Road Central, Central, Hong Kong",
    "street name only",
  );

  const composed = composePropertyFullAddresses({
    street_no: "41",
    street_name_en: "Connaught Road",
    district_en: "Central",
    city_en: "Hong Kong",
  });
  if (composed.full_address_en !== "41 Connaught Road, Central, Hong Kong") {
    throw new Error(`composePropertyFullAddresses failed: ${composed.full_address_en}`);
  }

  const display = formatPropertyV1AddressEn({
    street_no: "41",
    street_name_en: "Connaught Road",
    district_en: "Central",
    city_en: "Hong Kong",
    full_address_en: "41, Connaught Road, Central, Hong Kong",
  });
  if (display !== "41 Connaught Road, Central, Hong Kong") {
    throw new Error(`formatPropertyV1AddressEn should prefer composed address, got: ${display}`);
  }

  console.log("verify-compose-address: OK");
}

main();
