/** Normalize for natural-key matching */
export function normalizeKey(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function isBlank(value: string | null | undefined): boolean {
  return String(value ?? "").trim() === "";
}

export function parseBoolean(value: string): boolean | null {
  const v = value.trim().toLowerCase();
  if (v === "") return null;
  if (["true", "1", "yes", "y"].includes(v)) return true;
  if (["false", "0", "no", "n"].includes(v)) return false;
  return null;
}

export function parseNumber(value: string): number | null {
  const cleaned = value.trim().replace(/,/g, "");
  if (cleaned === "") return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function parseIntStrict(value: string): number | null {
  const cleaned = value.trim().replace(/,/g, "");
  if (cleaned === "") return null;
  const n = Number.parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : null;
}

export function parseDate(value: string): string | null {
  const v = value.trim();
  if (v === "") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  return null;
}

export function parseStringArray(value: string): string[] {
  if (isBlank(value)) return [];
  return value
    .split(/[,;/|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
