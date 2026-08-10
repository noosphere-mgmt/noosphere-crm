import { chromium } from "playwright";
import { renderProposalHtml, type ProposalRenderBundle } from "@/lib/proposals/renderProposalHtml";

export async function renderProposalPdf(bundle: ProposalRenderBundle): Promise<Buffer> {
  const html = renderProposalHtml(bundle);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
