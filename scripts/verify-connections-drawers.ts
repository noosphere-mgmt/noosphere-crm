import { listConnectionCompanies } from "@/lib/repos/connections";
import { listContacts } from "@/lib/repos/contacts";
import { resolveLegacyCompanyIdFromQuery, lookupV1CompanyId } from "@/lib/companyDrawerResolve";
import { resolveContactQueryParam, lookupV1ContactId, isV1ContactId } from "@/lib/contactDrawerResolve";
import { isV1CompanyId } from "@/lib/companyIdResolve";
import { getCompanyDrawerData, getContactDrawerData } from "@/lib/repos/connectionsDrawer";

function matchesDrawerOpen(
  openId: string,
  legacyId: number,
  v1Id: string | null,
): boolean {
  if (String(legacyId) === openId) return true;
  if (v1Id === openId) return true;
  return false;
}

async function main() {
  const companies = await listConnectionCompanies();
  const contacts = await listContacts();
  let failures = 0;

  console.log(`Companies: ${companies.length}, Contacts: ${contacts.length}`);

  for (const row of companies.slice(0, 5)) {
    const numericOpen = String(row.id);
    const resolved = await resolveLegacyCompanyIdFromQuery(numericOpen);
    const v1 = await lookupV1CompanyId(row.id);
    try {
      const drawer = await getCompanyDrawerData(row.id);
      if (!drawer) throw new Error("drawer null");
      if (!matchesDrawerOpen(numericOpen, row.id, drawer.v1CompanyId)) {
        console.error(`FAIL company numeric match id=${row.id} v1=${drawer.v1CompanyId}`);
        failures++;
      } else {
        console.log(`OK company numeric id=${row.id} v1=${drawer.v1CompanyId ?? "—"}`);
      }
      if (v1) {
        const resolvedV1 = await resolveLegacyCompanyIdFromQuery(v1);
        const drawerV1 = await getCompanyDrawerData(resolvedV1!);
        if (!drawerV1 || !matchesDrawerOpen(v1, row.id, drawerV1.v1CompanyId)) {
          console.error(`FAIL company v1 ref ${v1}`);
          failures++;
        } else {
          console.log(`OK company v1 ref ${v1}`);
        }
      }
    } catch (err) {
      console.error(`FAIL company drawer load id=${row.id}:`, err);
      failures++;
    }
  }

  for (const row of contacts.slice(0, 5)) {
    const numericOpen = String(row.id);
    try {
      const drawer = await getContactDrawerData(row.id);
      if (!drawer) throw new Error("drawer null");
      if (!matchesDrawerOpen(numericOpen, row.id, drawer.v1ContactId)) {
        console.error(`FAIL contact numeric match id=${row.id} v1=${drawer.v1ContactId}`);
        failures++;
      } else {
        console.log(`OK contact numeric id=${row.id} v1=${drawer.v1ContactId ?? "—"}`);
      }
      const v1 = await lookupV1ContactId(row.id);
      if (v1) {
        const resolved = await resolveContactQueryParam(v1);
        if (resolved?.kind !== "contact") throw new Error("v1 resolve failed");
        const drawerV1 = await getContactDrawerData(resolved.legacyContactId);
        if (!drawerV1 || !matchesDrawerOpen(v1, row.id, drawerV1.v1ContactId)) {
          console.error(`FAIL contact v1 ref ${v1}`);
          failures++;
        } else {
          console.log(`OK contact v1 ref ${v1}`);
        }
      }
    } catch (err) {
      console.error(`FAIL contact drawer load id=${row.id}:`, err);
      failures++;
    }
  }

  if (isV1CompanyId("COMP-2026-0001")) console.log("isV1CompanyId pattern ok");
  if (isV1ContactId("CONT-2026-0001")) console.log("isV1ContactId pattern ok");

  if (failures > 0) {
    console.error(`\n${failures} failure(s)`);
    process.exit(1);
  }
  console.log("\nAll drawer checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
