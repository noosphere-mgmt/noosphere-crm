import { formatMoney } from "@/lib/formatCurrency";
import { t } from "@/lib/proposals/i18n";
import type {
  Opportunity,
  OpportunityProposal,
  OpportunityProposalItem,
  ProposalLanguage,
} from "@/lib/types/entities";

export type ProposalRenderBundle = {
  proposal: OpportunityProposal;
  items: OpportunityProposalItem[];
  opportunity: Opportunity;
  preparedForLabel: string;
};

function esc(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl2br(s: string | null | undefined): string {
  return esc(s).replace(/\n/g, "<br/>");
}

function renderItemRow(item: OpportunityProposalItem, language: ProposalLanguage): string {
  const snap = item.premises_snapshot;
  const pricing = item.pricing_snapshot;
  const pid = snap?.premises_business_id ?? snap?.premises_id ?? item.premises_id;
  const building = snap?.building_name ?? item.building_name ?? "—";
  const label = snap?.display_label ?? "—";
  const area = snap?.area_sqft ? `${snap.area_sqft} sq ft` : "—";
  const capacity = snap?.capacity_pax != null ? `${snap.capacity_pax} pax` : "—";
  const displayRent = item.display_rent ?? pricing?.display_rent ?? "—";
  const ner =
    item.net_effective_rent != null
      ? formatMoney(item.net_effective_rent, pricing?.currency)
      : pricing?.net_effective_rent != null
        ? formatMoney(pricing.net_effective_rent, pricing.currency)
        : "—";
  const recommended = item.recommended
    ? `<span class="badge">${esc(t("proposal.recommended", language))}</span>`
    : "";

  return `
    <tr>
      <td>${recommended}${esc(pid)}</td>
      <td>${esc(building)}<div class="muted">${esc(snap?.district ?? "")}</div></td>
      <td>${esc(label)}<div class="muted">${esc([snap?.property_category, snap?.space_form].filter(Boolean).join(" · "))}</div></td>
      <td>${esc(area)}</td>
      <td>${esc(capacity)}</td>
      <td>${esc(displayRent)}<div class="muted">${esc(t("proposal.net_effective_rent", language))}: ${esc(ner)}</div></td>
    </tr>
    ${item.pros || item.cons || item.advisor_comment ? `
    <tr class="detail-row">
      <td colspan="6">
        ${item.pros ? `<p><strong>${esc(t("proposal.pros", language))}:</strong> ${nl2br(item.pros)}</p>` : ""}
        ${item.cons ? `<p><strong>${esc(t("proposal.cons", language))}:</strong> ${nl2br(item.cons)}</p>` : ""}
        ${item.advisor_comment ? `<p><strong>${esc(t("proposal.advisor_comment", language))}:</strong> ${nl2br(item.advisor_comment)}</p>` : ""}
      </td>
    </tr>` : ""}
  `;
}

export function renderProposalHtml(bundle: ProposalRenderBundle): string {
  const { proposal, items, opportunity, preparedForLabel } = bundle;
  const language = proposal.language;
  const date = proposal.proposal_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const dealRef = opportunity.business_id ?? `M${opportunity.id}`;

  const itemRows = items
    .slice()
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
    .map((item) => renderItemRow(item, language))
    .join("");

  return `<!DOCTYPE html>
<html lang="${language === "en" ? "en" : "zh"}">
<head>
  <meta charset="utf-8"/>
  <title>${esc(proposal.title)}</title>
  <style>
    body { font-family: "Noto Sans", "Helvetica Neue", Arial, sans-serif; color: #0f172a; margin: 40px; font-size: 11pt; }
    h1 { font-size: 20pt; margin: 0 0 8px; color: #065f46; }
    h2 { font-size: 13pt; margin: 24px 0 8px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .meta { color: #64748b; font-size: 10pt; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f8fafc; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; }
    .muted { color: #64748b; font-size: 9pt; margin-top: 2px; }
    .badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 8pt; padding: 2px 6px; border-radius: 4px; margin-right: 6px; }
    .detail-row td { background: #fafafa; font-size: 10pt; }
    .summary { line-height: 1.5; margin: 8px 0; white-space: pre-wrap; }
    footer { margin-top: 32px; font-size: 9pt; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <h1>${esc(t("proposal.title", language))}</h1>
  <div class="meta">
    <div>${esc(proposal.title)}</div>
    <div>${esc(t("proposal.date", language))}: ${esc(date)} · ${esc(dealRef)} · v${proposal.version_number}</div>
    <div>${esc(t("proposal.prepared_for", language))}: ${esc(preparedForLabel)}</div>
  </div>

  ${proposal.executive_summary ? `
  <h2>${esc(t("proposal.executive_summary", language))}</h2>
  <div class="summary">${nl2br(proposal.executive_summary)}</div>` : ""}

  ${proposal.consultancy_advice ? `
  <h2>${esc(t("proposal.consultancy_advice", language))}</h2>
  <div class="summary">${nl2br(proposal.consultancy_advice)}</div>` : ""}

  <h2>${esc(t("proposal.options", language))}</h2>
  <table>
    <thead>
      <tr>
        <th>${esc(t("proposal.premises", language))}</th>
        <th>${esc(t("proposal.building", language))}</th>
        <th>Location</th>
        <th>${esc(t("proposal.area", language))}</th>
        <th>${esc(t("proposal.capacity", language))}</th>
        <th>${esc(t("proposal.pricing", language))}</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows || `<tr><td colspan="6">—</td></tr>`}
    </tbody>
  </table>

  <footer>${esc(t("proposal.footnote", language))}</footer>
</body>
</html>`;
}
