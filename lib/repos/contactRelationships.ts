import { query } from "@/lib/db";
import type { ContactRelationship, ContactRelationshipType } from "@/lib/contactRelationships";

const ALLOWED_TYPES = new Set(["agent", "referrer"]);

export async function listContactRelationships(contactId: number): Promise<ContactRelationship[]> {
  return query<ContactRelationship>(
    `SELECT r.id, r.contact_id, r.related_company_id, r.relationship_type, r.notes,
            c.company_name AS related_company_name
     FROM contact_relationships r
     JOIN companies c ON c.id = r.related_company_id
     WHERE r.contact_id = $1
     ORDER BY r.relationship_type ASC, c.company_name ASC`,
    [contactId],
  );
}

export async function addContactRelationship(
  contactId: number,
  relatedCompanyId: number,
  relationshipType: string,
): Promise<number> {
  const type = relationshipType.trim().toLowerCase();
  if (!ALLOWED_TYPES.has(type)) {
    throw new Error("Invalid relationship type");
  }
  const rows = await query<{ id: string }>(
    `INSERT INTO contact_relationships (contact_id, related_company_id, relationship_type)
     VALUES ($1, $2, $3)
     ON CONFLICT (contact_id, related_company_id, relationship_type) DO NOTHING
     RETURNING id::text AS id`,
    [contactId, relatedCompanyId, type],
  );
  if (!rows[0]) {
    throw new Error("This relationship already exists");
  }
  return Number.parseInt(rows[0].id, 10);
}

export async function removeContactRelationship(id: number, contactId: number): Promise<void> {
  await query(`DELETE FROM contact_relationships WHERE id = $1 AND contact_id = $2`, [id, contactId]);
}

export function isContactRelationshipType(value: string): value is ContactRelationshipType {
  return ALLOWED_TYPES.has(value);
}
