/**
 * Property Sector filter uses contacts.coverage OR affiliated company.coverage (OR logic).
 * Usage: npx ts-node -r tsconfig-paths/register --compiler-options '{"module":"CommonJS"}' scripts/verify-property-sector-filter.ts
 */
import assert from "node:assert/strict";
import { contactMatchesPropertySectors, coverageMatchesAny } from "../lib/connectionsList";
import { PROPERTY_SECTOR_OPTIONS } from "../lib/connectionsValues";

function testOrLogic(): void {
  const commercial = { coverage: ["Commercial"] };
  const industrial = { coverage: ["Industrial"] };
  const both = { coverage: ["Commercial", "Industrial"] };
  const hotel = { coverage: ["Hotel"] };
  const empty = { coverage: [] };

  assert.equal(contactMatchesPropertySectors(commercial, ["Commercial"]), true);
  assert.equal(contactMatchesPropertySectors(industrial, ["Commercial"]), false);
  assert.equal(contactMatchesPropertySectors(industrial, ["Commercial", "Industrial"]), true);
  assert.equal(contactMatchesPropertySectors(both, ["Residential"]), false);
  assert.equal(contactMatchesPropertySectors(both, ["Commercial", "Residential"]), true);
  assert.equal(contactMatchesPropertySectors(hotel, ["Commercial", "Industrial", "Residential"]), false);
  assert.equal(contactMatchesPropertySectors(empty, []), true);
  assert.equal(contactMatchesPropertySectors(empty, ["Commercial"]), false);
  assert.equal(contactMatchesPropertySectors(empty, ["Commercial"], ["Commercial"]), true);
  assert.equal(contactMatchesPropertySectors(empty, ["Industrial"], ["Commercial"]), false);
  assert.ok(coverageMatchesAny(["Commercial", "Hotel"], ["Industrial", "Commercial"]));
  assert.deepEqual([...PROPERTY_SECTOR_OPTIONS], ["Commercial", "Industrial", "Residential"]);
  console.log("OK  property sector filter uses OR logic on coverage / company coverage");
}

testOrLogic();
