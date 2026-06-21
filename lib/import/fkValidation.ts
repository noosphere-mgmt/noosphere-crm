import { query } from "@/lib/db";

export async function companyExists(id: number): Promise<boolean> {
  const rows = await query<{ ok: number }>(`SELECT 1 AS ok FROM companies WHERE id = $1 LIMIT 1`, [id]);
  return rows.length > 0;
}

export async function contactExists(id: number): Promise<boolean> {
  const rows = await query<{ ok: number }>(`SELECT 1 AS ok FROM contacts WHERE id = $1 LIMIT 1`, [id]);
  return rows.length > 0;
}

export async function opportunityExists(id: number): Promise<boolean> {
  const rows = await query<{ ok: number }>(`SELECT 1 AS ok FROM opportunities WHERE id = $1 LIMIT 1`, [id]);
  return rows.length > 0;
}

export async function buildingExists(propertyId: string): Promise<boolean> {
  const rows = await query<{ ok: number }>(
    `SELECT 1 AS ok FROM properties_v1 WHERE property_id = $1 LIMIT 1`,
    [propertyId.trim()],
  );
  return rows.length > 0;
}

export async function premisesExists(premisesId: string): Promise<boolean> {
  const rows = await query<{ ok: number }>(
    `SELECT 1 AS ok FROM premises_v1 WHERE premises_id = $1 LIMIT 1`,
    [premisesId.trim()],
  );
  return rows.length > 0;
}

export async function activityExists(activityId: string): Promise<boolean> {
  const rows = await query<{ ok: number }>(
    `SELECT 1 AS ok FROM activities WHERE activity_id = $1 LIMIT 1`,
    [activityId.trim()],
  );
  return rows.length > 0;
}

export async function relationshipExists(relationshipId: string): Promise<boolean> {
  const rows = await query<{ ok: number }>(
    `SELECT 1 AS ok FROM relationships WHERE relationship_id = $1 LIMIT 1`,
    [relationshipId.trim()],
  );
  return rows.length > 0;
}

export function parseOptionalInt(raw: unknown): number | null {
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number.parseInt(String(raw).trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Safe bigint query param — never returns NaN (returns null if not a positive integer). */
export function parseBigIntParam(raw: unknown): number | null {
  return parseOptionalInt(raw);
}

export function parseOptionalText(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  return s || null;
}

export async function validateFk(
  label: string,
  raw: unknown,
  check: (id: number) => Promise<boolean>,
): Promise<string | null> {
  const id = parseOptionalInt(raw);
  if (id == null) return null;
  if (!(await check(id))) return `${label} ${id} not found`;
  return null;
}

export async function validateFkText(
  label: string,
  raw: unknown,
  check: (id: string) => Promise<boolean>,
): Promise<string | null> {
  const id = parseOptionalText(raw);
  if (id == null) return null;
  if (!(await check(id))) return `${label} ${id} not found`;
  return null;
}
