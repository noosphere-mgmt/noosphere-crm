/**
 * Capture mobile (390px) admin page screenshots for documentation.
 * Usage: dev server on :3001, then npm run screenshots:mobile
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
const OUT = path.join(__dirname, "..", "docs", "mobile-screenshots", "after");

const PAGES = [
  { name: "dashboard", path: "/admin" },
  { name: "properties", path: "/admin/properties" },
  { name: "connections", path: "/admin/companies" },
  { name: "opportunities", path: "/admin/opportunities" },
];

async function main() {
  if (!TOKEN) {
    console.error("ADMIN_TOKEN is not set — cannot authenticate for screenshots.");
    process.exit(1);
  }

  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="password"]', TOKEN);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 15000 });

  for (const { name, path: route } of PAGES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const file = path.join(OUT, `${name}-390px.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`Saved ${file}`);
  }

  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
