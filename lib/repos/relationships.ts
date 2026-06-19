import { query, withTransaction, type DbClient } from "@/lib/db";
import {
  creationTypeToReverseType,
  entityIdString,
  isCreationRelationshipType,
  isEntityType,
  isRelationshipStatus,
  isRelationshipType,
  reverseRelationshipType,
  type CreationRelationshipType,
  type EntityRelationshipRow,
  type EntityType,
  type RelationshipStatus,
  type RelationshipType,
} from "@/lib/entityRelationships";

type RelationshipRecord = {
  relationship_id: string;
  from_entity_type: string;
  from_entity_id: string;
  to_entity_type: string;
  to_entity_id: string;
  relationship_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

export type RelationshipInput = {
  from_entity_type: EntityType;
  from_entity_id: string;
  to_entity_type: EntityType;
  to_entity_id: string;
  relationship_type: CreationRelationshipType;
  status?: RelationshipStatus;
  start_date?: string | null;
  end_date?: string | null;
  remarks?: string | null;
};

const RELATIONSHIP_SELECT = `relationship_id, from_entity_type, from_entity_id, to_entity_type, to_entity_id,
              relationship_type, status, start_date::text, end_date::text, remarks,
              created_at::text, updated_at::text`;

async function resolveEntityName(entityType: EntityType, entityId: string): Promise<string> {
  if (entityType === "company") {
    const id = Number.parseInt(entityId, 10);
    if (!Number.isFinite(id)) return entityId;
    const rows = await query<{ company_name: string }>(
      `SELECT company_name FROM companies WHERE id = $1`,
      [id],
    );
    return rows[0]?.company_name ?? `Company #${entityId}`;
  }
  const id = Number.parseInt(entityId, 10);
  if (!Number.isFinite(id)) return entityId;
  const rows = await query<{ contact_name: string }>(
    `SELECT COALESCE(display_name, contact_name) AS contact_name FROM contacts WHERE id = $1`,
    [id],
  );
  return rows[0]?.contact_name ?? `Contact #${entityId}`;
}

function toEntityRow(row: RelationshipRecord, relatedName: string): EntityRelationshipRow {
  return {
    relationship_id: row.relationship_id,
    relationship_type: row.relationship_type,
    related_entity_type: row.to_entity_type as EntityType,
    related_entity_id: row.to_entity_id,
    related_entity_name: relatedName,
    status: row.status,
    remarks: row.remarks,
    start_date: row.start_date?.slice(0, 10) ?? null,
    end_date: row.end_date?.slice(0, 10) ?? null,
  };
}

async function insertRelationshipRow(
  client: DbClient,
  input: {
    from_entity_type: EntityType;
    from_entity_id: string;
    to_entity_type: EntityType;
    to_entity_id: string;
    relationship_type: RelationshipType;
    status: RelationshipStatus;
    start_date?: string | null;
    end_date?: string | null;
    remarks?: string | null;
  },
): Promise<string> {
  const result = await client.query<{ relationship_id: string }>(
    `INSERT INTO relationships (
       relationship_id,
       from_entity_type, from_entity_id,
       to_entity_type, to_entity_id,
       relationship_type, status,
       start_date, end_date, remarks
     ) VALUES (
       'rel_' || replace(gen_random_uuid()::text, '-', ''),
       $1, $2, $3, $4, $5, $6, $7, $8, $9
     )
     RETURNING relationship_id`,
    [
      input.from_entity_type,
      input.from_entity_id,
      input.to_entity_type,
      input.to_entity_id,
      input.relationship_type,
      input.status,
      input.start_date?.trim() || null,
      input.end_date?.trim() || null,
      input.remarks?.trim() || null,
    ],
  );
  return result.rows[0]!.relationship_id;
}

async function findReverseRelationship(row: RelationshipRecord): Promise<RelationshipRecord | null> {
  const reverseType = reverseRelationshipType(row.relationship_type);
  if (!reverseType) return null;

  const rows = await query<RelationshipRecord>(
    `SELECT ${RELATIONSHIP_SELECT}
     FROM relationships
     WHERE from_entity_type = $1 AND from_entity_id = $2
       AND to_entity_type = $3 AND to_entity_id = $4
       AND relationship_type = $5
     LIMIT 1`,
    [row.to_entity_type, row.to_entity_id, row.from_entity_type, row.from_entity_id, reverseType],
  );
  return rows[0] ?? null;
}

export async function listEntityRelationships(
  entityType: EntityType,
  entityId: number,
): Promise<EntityRelationshipRow[]> {
  const id = entityIdString(entityId);

  const outgoing = await query<RelationshipRecord>(
    `SELECT ${RELATIONSHIP_SELECT}
     FROM relationships
     WHERE from_entity_type = $1 AND from_entity_id = $2
     ORDER BY relationship_type ASC, updated_at DESC`,
    [entityType, id],
  );

  const rows: EntityRelationshipRow[] = [];
  for (const row of outgoing) {
    const name = await resolveEntityName(row.to_entity_type as EntityType, row.to_entity_id);
    rows.push(toEntityRow(row, name));
  }

  return rows;
}

export async function createRelationship(input: RelationshipInput): Promise<string> {
  if (!isEntityType(input.from_entity_type) || !isEntityType(input.to_entity_type)) {
    throw new Error("Invalid entity type");
  }
  if (!isCreationRelationshipType(input.relationship_type)) {
    throw new Error("Invalid relationship type");
  }
  const status = input.status ?? "Active";
  if (!isRelationshipStatus(status)) {
    throw new Error("Invalid relationship status");
  }
  if (
    input.from_entity_type === input.to_entity_type &&
    input.from_entity_id === input.to_entity_id
  ) {
    throw new Error("Cannot relate an entity to itself");
  }

  const reverseType = creationTypeToReverseType(input.relationship_type);

  return withTransaction(async (client) => {
    const forwardId = await insertRelationshipRow(client, {
      from_entity_type: input.from_entity_type,
      from_entity_id: input.from_entity_id,
      to_entity_type: input.to_entity_type,
      to_entity_id: input.to_entity_id,
      relationship_type: input.relationship_type,
      status,
      start_date: input.start_date,
      end_date: input.end_date,
      remarks: input.remarks,
    });

    await insertRelationshipRow(client, {
      from_entity_type: input.to_entity_type,
      from_entity_id: input.to_entity_id,
      to_entity_type: input.from_entity_type,
      to_entity_id: input.from_entity_id,
      relationship_type: reverseType,
      status,
      start_date: input.start_date,
      end_date: input.end_date,
      remarks: null,
    });

    return forwardId;
  });
}

export async function updateRelationship(
  relationshipId: string,
  patch: {
    relationship_type?: RelationshipType;
    status?: RelationshipStatus;
    start_date?: string | null;
    end_date?: string | null;
    remarks?: string | null;
  },
): Promise<void> {
  if (patch.relationship_type && !isRelationshipType(patch.relationship_type)) {
    throw new Error("Invalid relationship type");
  }
  if (patch.status && !isRelationshipStatus(patch.status)) {
    throw new Error("Invalid relationship status");
  }

  const row = await getRelationship(relationshipId);
  if (!row) throw new Error("Relationship not found");

  const reverse = await findReverseRelationship(row);
  const nextForwardType = patch.relationship_type ?? row.relationship_type;
  const nextReverseType = reverseRelationshipType(nextForwardType);

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE relationships SET
         relationship_type = $2,
         status = $3,
         start_date = $4,
         end_date = $5,
         remarks = $6,
         updated_at = NOW()
       WHERE relationship_id = $1`,
      [
        relationshipId,
        nextForwardType,
        patch.status ?? row.status,
        patch.start_date !== undefined ? patch.start_date?.trim() || null : row.start_date?.slice(0, 10) ?? null,
        patch.end_date !== undefined ? patch.end_date?.trim() || null : row.end_date?.slice(0, 10) ?? null,
        patch.remarks !== undefined ? patch.remarks?.trim() || null : row.remarks,
      ],
    );

    if (reverse && nextReverseType) {
      await client.query(
        `UPDATE relationships SET
           relationship_type = $2,
           status = $3,
           start_date = $4,
           end_date = $5,
           updated_at = NOW()
         WHERE relationship_id = $1`,
        [
          reverse.relationship_id,
          nextReverseType,
          patch.status ?? reverse.status,
          patch.start_date !== undefined ? patch.start_date?.trim() || null : reverse.start_date?.slice(0, 10) ?? null,
          patch.end_date !== undefined ? patch.end_date?.trim() || null : reverse.end_date?.slice(0, 10) ?? null,
        ],
      );
    }
  });
}

export async function deleteRelationship(relationshipId: string): Promise<void> {
  const row = await getRelationship(relationshipId);
  if (!row) return;

  const reverse = await findReverseRelationship(row);

  await withTransaction(async (client) => {
    await client.query(`DELETE FROM relationships WHERE relationship_id = $1`, [relationshipId]);
    if (reverse) {
      await client.query(`DELETE FROM relationships WHERE relationship_id = $1`, [reverse.relationship_id]);
    }
  });
}

export async function getRelationship(relationshipId: string): Promise<RelationshipRecord | null> {
  const rows = await query<RelationshipRecord>(
    `SELECT ${RELATIONSHIP_SELECT}
     FROM relationships WHERE relationship_id = $1`,
    [relationshipId],
  );
  return rows[0] ?? null;
}

export type RelationshipSearchHit = {
  entity_type: EntityType;
  entity_id: string;
  label: string;
  subtitle: string | null;
};

export async function searchRelationshipEntities(
  partyType: EntityType,
  q: string,
  limit = 15,
): Promise<RelationshipSearchHit[]> {
  const term = q.trim();
  if (!term) return [];

  if (partyType === "company") {
    return query<RelationshipSearchHit>(
      `SELECT 'company'::text AS entity_type,
              id::text AS entity_id,
              company_name AS label,
              NULL::text AS subtitle
       FROM companies
       WHERE is_active = TRUE AND company_name ILIKE $1
       ORDER BY company_name ASC
       LIMIT $2`,
      [`%${term}%`, limit],
    );
  }

  return query<RelationshipSearchHit>(
    `SELECT 'contact'::text AS entity_type,
            c.id::text AS entity_id,
            COALESCE(c.display_name, c.contact_name) AS label,
            co.company_name AS subtitle
     FROM contacts c
     JOIN companies co ON co.id = c.company_id
     WHERE c.is_active = TRUE
       AND (COALESCE(c.display_name, c.contact_name) ILIKE $1 OR co.company_name ILIKE $1)
     ORDER BY COALESCE(c.display_name, c.contact_name) ASC
     LIMIT $2`,
    [`%${term}%`, limit],
  );
}
