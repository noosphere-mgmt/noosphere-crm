/**
 * Document redirect sources for the new-building flow.
 * Usage: npm run verify:new-building-route
 */
import { redirect } from "next/navigation";
import { describeNextRedirect } from "../lib/nextNavigation";

const CANONICAL = "/admin/properties/buildings/new";

function probeRedirect(url: string): void {
  try {
    redirect(url);
  } catch (err) {
    console.log(`redirect(${JSON.stringify(url)})`);
    console.log(`  digest: ${(err as { digest?: string }).digest ?? "(none)"}`);
    console.log(`  ${describeNextRedirect(err) ?? ""}`);
  }
}

console.log("New building route map\n");
console.log(`Canonical page: ${CANONICAL}`);
console.log("  - No redirect on load; renders empty building form");
console.log("  - Optional data failures → empty dropdowns + amber warning banner\n");

console.log("Legacy aliases that redirect on load:");
probeRedirect("/admin/properties/buildings/new");
console.log("");
probeRedirect("/admin/properties/new");
console.log("  (legacy /admin/properties/new → /admin/properties/buildings/new)\n");

console.log("Auth (middleware, not NEXT_REDIRECT): unauthenticated → /admin/login?next=...\n");

console.log("After save (server action, outside try/catch):");
console.log("  createPropertyV1Action → /admin/properties/buildings?property=BLDG-...&mode=view");
console.log("  (return_to base path is preserved; property + mode=view are always appended)\n");
