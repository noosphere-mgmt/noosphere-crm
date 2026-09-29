/**
 * Company relationship inverse pairs.
 * Usage: npm run verify:relationship-pairs
 */
import assert from "node:assert/strict";
import {
  addableRelationshipTypesFor,
  reverseRelationshipType,
} from "../lib/entityRelationships";

assert.equal(reverseRelationshipType("Refers"), "Referred By");
assert.equal(reverseRelationshipType("Referred By"), "Refers");
assert.equal(reverseRelationshipType("Represents"), "Represented By");
assert.equal(reverseRelationshipType("Represented By"), "Represents");

assert.equal(reverseRelationshipType("Subsidiary of"), "Holding Company of");
assert.equal(reverseRelationshipType("Holding Company of"), "Subsidiary of");

const companyOptions = addableRelationshipTypesFor("company", "company");
assert.ok(companyOptions.includes("Subsidiary of"));
assert.ok(companyOptions.includes("Holding Company of"));
assert.ok(companyOptions.includes("Refers"));

const contactOptions = addableRelationshipTypesFor("contact", "company");
assert.equal(contactOptions.includes("Subsidiary of"), false);
assert.equal(contactOptions.includes("Holding Company of"), false);
assert.ok(contactOptions.includes("Refers"));
assert.ok(contactOptions.includes("Represents"));

const companyToContact = addableRelationshipTypesFor("company", "contact");
assert.equal(companyToContact.includes("Subsidiary of"), false);
assert.equal(companyToContact.includes("Holding Company of"), false);

console.log("OK  relationship pairs");
