import path from "node:path";
import type { ProposalLanguage } from "@/lib/types/entities";

export type ProposalLabelKey =
  | "proposal.title"
  | "proposal.date"
  | "proposal.prepared_for"
  | "proposal.executive_summary"
  | "proposal.consultancy_advice"
  | "proposal.options"
  | "proposal.recommended"
  | "proposal.building"
  | "proposal.premises"
  | "proposal.area"
  | "proposal.capacity"
  | "proposal.pricing"
  | "proposal.display_rent"
  | "proposal.net_effective_rent"
  | "proposal.total_initial_cost"
  | "proposal.pros"
  | "proposal.cons"
  | "proposal.advisor_comment"
  | "proposal.footnote";

const LABELS: Record<ProposalLanguage, Record<ProposalLabelKey, string>> = {
  en: {
    "proposal.title": "Property Proposal",
    "proposal.date": "Date",
    "proposal.prepared_for": "Prepared for",
    "proposal.executive_summary": "Executive summary",
    "proposal.consultancy_advice": "Consultancy advice",
    "proposal.options": "Property options",
    "proposal.recommended": "Recommended",
    "proposal.building": "Building",
    "proposal.premises": "Premises",
    "proposal.area": "Area",
    "proposal.capacity": "Capacity",
    "proposal.pricing": "Pricing",
    "proposal.display_rent": "Asking rent",
    "proposal.net_effective_rent": "Net effective rent",
    "proposal.total_initial_cost": "Total initial cost",
    "proposal.pros": "Pros",
    "proposal.cons": "Cons",
    "proposal.advisor_comment": "Advisor comment",
    "proposal.footnote": "Confidential — prepared by Noosphere Real Estate",
  },
  "zh-Hant": {
    "proposal.title": "物業建議書",
    "proposal.date": "日期",
    "proposal.prepared_for": "致",
    "proposal.executive_summary": "摘要",
    "proposal.consultancy_advice": "顧問意見",
    "proposal.options": "物業選項",
    "proposal.recommended": "推薦",
    "proposal.building": "大廈",
    "proposal.premises": "單位",
    "proposal.area": "面積",
    "proposal.capacity": "容納人數",
    "proposal.pricing": "租金",
    "proposal.display_rent": "叫價",
    "proposal.net_effective_rent": "實效租金",
    "proposal.total_initial_cost": "初期總成本",
    "proposal.pros": "優點",
    "proposal.cons": "注意事項",
    "proposal.advisor_comment": "顧問備註",
    "proposal.footnote": "機密文件 — Noosphere Real Estate",
  },
  "zh-Hans": {
    "proposal.title": "物业建议书",
    "proposal.date": "日期",
    "proposal.prepared_for": "致",
    "proposal.executive_summary": "摘要",
    "proposal.consultancy_advice": "顾问意见",
    "proposal.options": "物业选项",
    "proposal.recommended": "推荐",
    "proposal.building": "大厦",
    "proposal.premises": "单位",
    "proposal.area": "面积",
    "proposal.capacity": "容纳人数",
    "proposal.pricing": "租金",
    "proposal.display_rent": "叫价",
    "proposal.net_effective_rent": "实效租金",
    "proposal.total_initial_cost": "初期总成本",
    "proposal.pros": "优点",
    "proposal.cons": "注意事项",
    "proposal.advisor_comment": "顾问备注",
    "proposal.footnote": "机密文件 — Noosphere Real Estate",
  },
};

export function t(key: ProposalLabelKey, language: ProposalLanguage): string {
  return LABELS[language]?.[key] ?? LABELS.en[key];
}

export function resolveLocalizedBuildingName(
  language: ProposalLanguage,
  en: string | null | undefined,
  zh: string | null | undefined,
  cn: string | null | undefined,
): string {
  const fallback = en?.trim() || "—";
  if (language === "zh-Hant") return zh?.trim() || fallback;
  if (language === "zh-Hans") return cn?.trim() || zh?.trim() || fallback;
  return fallback;
}

export function mapContactLanguageToProposal(preferred: string | null | undefined): ProposalLanguage {
  const p = (preferred ?? "").trim().toLowerCase();
  if (p.includes("trad") || p.includes("繁") || p === "zh-hk" || p === "zh-tw") return "zh-Hant";
  if (p.includes("simp") || p.includes("简") || p === "zh-cn" || p === "zh-hans") return "zh-Hans";
  if (p.startsWith("zh")) return "zh-Hant";
  return "en";
}

export const PROPOSAL_LANGUAGE_OPTIONS: { value: ProposalLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "zh-Hant", label: "Traditional Chinese" },
  { value: "zh-Hans", label: "Simplified Chinese" },
];

export function proposalStorageRoot(): string {
  return process.env.PROPOSAL_STORAGE_DIR?.trim() || path.join(process.cwd(), "data", "proposals");
}
