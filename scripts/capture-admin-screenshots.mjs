/**
 * Capture admin page screenshots for desktop (1440px) and mobile (390px).
 * Usage: dev server on :3001, ADMIN_TOKEN set, then npm run screenshots:admin
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env") });
config({ path: path.join(__dirname, "..", ".env.local") });

const BASE = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3001";
const TOKEN = process.env.ADMIN_TOKEN?.trim();
const MOBILE_OUT = path.join(__dirname, "..", "docs", "admin-screenshots", "mobile");
const DESKTOP_OUT = path.join(__dirname, "..", "docs", "admin-screenshots", "desktop");

const PAGES = [
  { name: "dashboard", path: "/admin" },
  { name: "premises", path: "/admin/properties" },
  { name: "buildings", path: "/admin/properties/buildings" },
  { name: "connections-companies", path: "/admin/companies" },
  { name: "connections-contacts", path: "/admin/contacts" },
  { name: "opportunities", path: "/admin/opportunities" },
];

async function login(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="password"]', TOKEN);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 15000 });
}

async function captureSet(browser, viewport, outDir, suffix) {
  mkdirSync(outDir, { recursive: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: suffix === "390px" ? 2 : 1,
    ...(suffix === "390px" ? { isMobile: true, hasTouch: true } : {}),
  });
  const page = await context.newPage();
  await login(page);

  for (const { name, path: route } of PAGES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const file = path.join(outDir, `${name}-${suffix}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`Saved ${file}`);
  }

  await context.close();
}

async function main() {
  if (!TOKEN) {
    console.error("ADMIN_TOKEN is not set — cannot authenticate for screenshots.");
    process.exit(1);
  }

  const browser = await chromium.launch();

  await captureSet(browser, { width: 390, height: 844 }, MOBILE_OUT, "390px");
  await captureSet(browser, { width: 1440, height: 900 }, DESKTOP_OUT, "1440px");

  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
