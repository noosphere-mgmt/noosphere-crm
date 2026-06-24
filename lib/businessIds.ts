/** Permanent business ID prefixes (one record = one ID everywhere). */
export const BUSINESS_ID_PREFIX = {
  company: { prefix: "C", start: 100001 },
  contact: { prefix: "D", start: 100001 },
  building: { prefix: "B", start: 100001 },
  premise: { prefix: "P", start: 100001 },
  opportunity: { prefix: "M", start: 100001 },
  activity: { prefix: "A", start: 100001 },
} as const;

export type BusinessEntityType = keyof typeof BUSINESS_ID_PREFIX;

const BUSINESS_ID_RE: Record<BusinessEntityType, RegExp> = {
  company: /^C\d{6}$/,
  contact: /^D\d{6}$/,
  building: /^B\d{6}$/,
  premise: /^P\d{6}$/,
  opportunity: /^M\d{6}$/,
  activity: /^A\d{6}$/,
};

export function isPermanentBusinessId(entityType: BusinessEntityType, value: unknown): boolean {
  const s = String(value ?? "").trim();
  return Boolean(s && BUSINESS_ID_RE[entityType].test(s));
}

export function formatBusinessId(entityType: BusinessEntityType, sequence: number): string {
  const { prefix } = BUSINESS_ID_PREFIX[entityType];
  return `${prefix}${String(sequence).padStart(6, "0")}`;
}

export function detectBusinessEntityType(value: unknown): BusinessEntityType | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  for (const entityType of Object.keys(BUSINESS_ID_RE) as BusinessEntityType[]) {
    if (BUSINESS_ID_RE[entityType].test(s)) return entityType;
  }
  return null;
}
