import { query } from "@/lib/db";

export type OpportunityDocument = {
  id: number;
  opportunity_id: number;
  title: string;
  category: string;
  original_name: string;
  stored_file: string;
  mime_type: string;
  file_size: number;
  notes: string | null;
  created_at: string;
};

export async function listOpportunityDocuments(opportunityId: number): Promise<OpportunityDocument[]> {
  const rows = await query<OpportunityDocument>(
    `SELECT id, opportunity_id, title, category, original_name, stored_file, mime_type,
            file_size::int, notes, created_at::text
     FROM opportunity_documents
     WHERE opportunity_id = $1
     ORDER BY created_at DESC, id DESC`,
    [opportunityId],
  );
  return rows.map((row) => ({ ...row, id: Number(row.id), opportunity_id: Number(row.opportunity_id), file_size: Number(row.file_size) }));
}

export async function getOpportunityDocument(id: number): Promise<OpportunityDocument | null> {
  const rows = await query<OpportunityDocument>(
    `SELECT id, opportunity_id, title, category, original_name, stored_file, mime_type,
            file_size::int, notes, created_at::text
     FROM opportunity_documents WHERE id = $1`,
    [id],
  );
  const row = rows[0];
  return row ? { ...row, id: Number(row.id), opportunity_id: Number(row.opportunity_id), file_size: Number(row.file_size) } : null;
}

export async function createOpportunityDocument(input: Omit<OpportunityDocument, "id" | "created_at">): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO opportunity_documents
       (opportunity_id, title, category, original_name, stored_file, mime_type, file_size, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id::text`,
    [input.opportunity_id, input.title, input.category, input.original_name, input.stored_file, input.mime_type, input.file_size, input.notes],
  );
  return Number.parseInt(rows[0]!.id, 10);
}

export async function deleteOpportunityDocument(id: number): Promise<void> {
  await query(`DELETE FROM opportunity_documents WHERE id = $1`, [id]);
}
