export type RequirementSuggestion = {
  field: string;
  label: string;
  value: string | number;
  confidence: "High" | "Medium";
};

const DISTRICTS: { label: string; aliases: string[] }[] = [
  { label: "Central", aliases: ["central", "中環", "中环"] },
  { label: "Sheung Wan", aliases: ["sheung wan", "上環", "上环"] },
  { label: "Admiralty", aliases: ["admiralty", "金鐘", "金钟"] },
  { label: "Wan Chai", aliases: ["wan chai", "wanchai", "灣仔", "湾仔"] },
  { label: "Causeway Bay", aliases: ["causeway bay", "銅鑼灣", "铜锣湾"] },
  { label: "Tsim Sha Tsui", aliases: ["tsim sha tsui", "tst", "尖沙咀"] },
  { label: "Mong Kok", aliases: ["mong kok", "旺角"] },
  { label: "Kwun Tong", aliases: ["kwun tong", "觀塘", "观塘"] },
  { label: "Kowloon Bay", aliases: ["kowloon bay", "九龍灣", "九龙湾"] },
  { label: "Quarry Bay", aliases: ["quarry bay", "鰂魚涌", "鲗鱼涌"] },
  { label: "North Point", aliases: ["north point", "北角"] },
  { label: "Sha Tin", aliases: ["sha tin", "shatin", "沙田"] },
];

function firstNumber(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const value = Number.parseFloat(match[1].replace(/,/g, ""));
    if (Number.isFinite(value)) return value;
  }
  return null;
}

export function analyseOpportunityRequirement(text: string): RequirementSuggestion[] {
  const lower = text.toLowerCase();
  const suggestions: RequirementSuggestion[] = [];
  const push = (field: string, label: string, value: string | number, confidence: "High" | "Medium" = "High") => {
    if (!suggestions.some((item) => item.field === field)) suggestions.push({ field, label, value, confidence });
  };

  if (/bank account|incorporat|company secretar|銀行戶口|银行账户|公司註冊|公司注册/.test(lower)) {
    push("sales_role", "Sales Role", "others");
  } else if (/sell|sale|disposal|dispose|出售|放售/.test(lower)) {
    push("sales_role", "Sales Role", "to_sell");
  } else if (/buy|purchase|acquisition|acquire|買入|购买|收購|收购/.test(lower)) {
    push("sales_role", "Sales Role", "to_buy");
  } else if (/to let|landlord|業主|业主|放租/.test(lower)) {
    push("sales_role", "Sales Role", "to_let");
  } else if (/lease|rent|rental|租|月租/.test(lower)) {
    push("sales_role", "Sales Role", "to_lease");
  }

  if (/serviced office|服務式辦公|服务式办公/.test(lower)) {
    push("property_category_preference", "Required Type", "commercial");
    push("property_type_preference", "Required Subtype", "serviced_office");
  } else if (/sublet|sub-?lease|shared office|分租|共享辦公|共享办公/.test(lower)) {
    push("property_category_preference", "Required Type", "commercial");
    push("property_type_preference", "Required Subtype", "shared_sublet_office");
  } else if (/shop|retail|店舖|商舖|商铺|零售/.test(lower)) {
    push("property_category_preference", "Required Type", "commercial");
    push("property_type_preference", "Required Subtype", "shop_retail");
  } else if (/industrial|factory|工業|工业|廠房|厂房/.test(lower)) {
    push("property_category_preference", "Required Type", "industrial");
    push("property_type_preference", "Required Subtype", "industrial_unit");
  } else if (/residential|flat|apartment|住宅|單位|单位/.test(lower)) {
    push("property_category_preference", "Required Type", "residential");
    push("property_type_preference", "Required Subtype", /serviced/.test(lower) ? "serviced_unit" : "flat", "Medium");
  } else if (/office|commercial|辦公|办公|寫字樓|写字楼/.test(lower)) {
    push("property_category_preference", "Required Type", "commercial");
    push("property_type_preference", "Required Subtype", "conventional_office", "Medium");
  }

  const matchedDistricts = DISTRICTS.filter((district) => district.aliases.some((alias) => lower.includes(alias))).map((district) => district.label);
  if (matchedDistricts.length > 0) push("district_preference", "Location", matchedDistricts.join(", "));

  const area = firstNumber(text, [/(\d[\d,]*(?:\.\d+)?)\s*(?:sq\.?\s*ft|sqft|平方呎|平方英尺)/i]);
  if (area != null) push("required_area_sqft", "Area (Sq Ft)", area);
  const capacity = firstNumber(text, [/(\d+)\s*(?:pax|people|persons?|staff|employees?|人|位)/i]);
  if (capacity != null) push("required_capacity_pax", "Capacity", capacity);
  const budget = firstNumber(text, [/(?:hk\$|hkd|budget|預算|预算)\s*[:：]?\s*\$?\s*(\d[\d,]*(?:\.\d+)?)/i]);
  if (budget != null) push("budget_max", "Budget (HKD)", budget);

  return suggestions;
}

export function requirementSuggestionDisplayValue(item: RequirementSuggestion): string {
  const labels: Record<string, string> = {
    to_lease: "To Lease", to_let: "To Let", to_buy: "To Buy", to_sell: "To Sell", others: "Others",
    prof_service: "Others",
    commercial: "Commercial", residential: "Residential", industrial: "Industrial",
    conventional_office: "Conventional Office", serviced_office: "Serviced Office",
    shared_sublet_office: "Shared / Sublet Office", shared_sublet: "Shared / Sublet Office",
    shop_retail: "Shop / Retail", industrial_unit: "Industrial Unit", flat: "Flat",
    serviced_unit: "Serviced Unit", shared_flat: "Shared Flat", land: "Land", other: "Other",
  };
  return labels[String(item.value)] ?? String(item.value);
}
