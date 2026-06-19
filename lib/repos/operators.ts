import { query } from "@/lib/db";
import type { Operator } from "@/lib/types/entities";

export async function listOperators(): Promise<Operator[]> {
  return query<Operator>(
    `SELECT id, name, is_active, notes, created_at::text, updated_at::text
     FROM operators
     ORDER BY name ASC, id ASC`,
  );
}

export async function getOperator(id: number): Promise<Operator | null> {
  const rows = await query<Operator>(
    `SELECT id, name, is_active, notes, created_at::text, updated_at::text
     FROM operators WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function createOperator(input: {
  name: string;
  is_active?: boolean;
  notes?: string | null;
}): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO operators (name, is_active, notes)
     VALUES ($1, $2, $3)
     RETURNING id::text AS id`,
    [input.name.trim(), input.is_active ?? true, input.notes?.trim() || null],
  );
  return Number.parseInt(rows[0]!.id, 10);
}

export async function updateOperator(
  id: number,
  input: { name: string; is_active: boolean; notes?: string | null },
): Promise<void> {
  await query(
    `UPDATE operators SET name = $2, is_active = $3, notes = $4 WHERE id = $1`,
    [id, input.name.trim(), input.is_active, input.notes?.trim() || null],
  );
}

export async function deleteOperator(id: number): Promise<void> {
  await query(`DELETE FROM operators WHERE id = $1`, [id]);
}
