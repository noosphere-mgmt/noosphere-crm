"use server";

import { revalidatePath } from "next/cache";
import {
  entityIdString,
  isCreationRelationshipType,
  isEntityType,
  isRelationshipStatus,
  type CreationRelationshipType,
  type EntityType,
  type RelationshipStatus,
  type RelationshipType,
} from "@/lib/entityRelationships";
import {
  createRelationship,
  deleteRelationship,
  getRelationship,
  searchRelationshipEntities,
  updateRelationship,
} from "@/lib/repos/relationships";

function parseOptionalString(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function parsePositiveInt(value: FormDataEntryValue | null): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.trunc(value);
  const s = String(value).trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseEntityFromForm(formData: FormData): { entityType: EntityType; entityId: number } | { error: string } {
  const entityType = String(formData.get("entity_type") ?? "").trim();
  const entityId = parsePositiveInt(formData.get("entity_id"));
  if (!isEntityType(entityType) || entityId == null) {
    return { error: "Invalid entity" };
  }
  return { entityType, entityId };
}

function revalidateEntity(entityType: EntityType, entityId: number) {
  if (entityType === "company") {
    revalidatePath("/admin/companies");
    revalidatePath(`/admin/companies/${entityId}`);
  } else {
    revalidatePath("/admin/contacts");
    revalidatePath(`/admin/contacts/${entityId}`);
  }
}

export async function searchRelationshipEntitiesAction(
  partyType: string,
  query: string,
): Promise<{ ok: true; hits: Awaited<ReturnType<typeof searchRelationshipEntities>> } | { ok: false; error: string }> {
  if (!isEntityType(partyType)) return { ok: false, error: "Invalid party type" };
  const hits = await searchRelationshipEntities(partyType, query);
  return { ok: true, hits };
}

export async function addEntityRelationshipAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const entity = parseEntityFromForm(formData);
  if ("error" in entity) return { ok: false, error: entity.error };
  const { entityType, entityId } = entity;

  const relatedType = String(formData.get("related_entity_type") ?? "").trim();
  const relatedId = String(formData.get("related_entity_id") ?? "").trim();
  const relationshipType = String(formData.get("relationship_type") ?? "").trim();
  const status = "Active" as RelationshipStatus;

  if (!isEntityType(relatedType) || !relatedId) {
    return { ok: false, error: "Select a related party" };
  }
  if (!isCreationRelationshipType(relationshipType)) {
    return { ok: false, error: "Select a relationship type" };
  }

  try {
    await createRelationship({
      from_entity_type: entityType,
      from_entity_id: entityIdString(entityId),
      to_entity_type: relatedType,
      to_entity_id: relatedId,
      relationship_type: relationshipType as CreationRelationshipType,
      status,
      remarks: parseOptionalString(formData.get("remarks")),
    });
    revalidateEntity(entityType, entityId);
    revalidateEntity(relatedType, Number.parseInt(relatedId, 10));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not add relationship" };
  }
}

export async function updateEntityRelationshipAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const relationshipId = String(formData.get("relationship_id") ?? "").trim();
  if (!relationshipId) return { ok: false, error: "Relationship not found" };

  const entity = parseEntityFromForm(formData);
  if ("error" in entity) return { ok: false, error: entity.error };
  const { entityType, entityId } = entity;

  const relationshipType = formData.get("relationship_type");
  const status = String(formData.get("status") ?? "").trim() as RelationshipStatus;
  if (relationshipType != null) {
    const type = String(relationshipType).trim();
    if (!isCreationRelationshipType(type)) return { ok: false, error: "Invalid relationship type" };
  }
  if (!isRelationshipStatus(status)) return { ok: false, error: "Invalid status" };

  const row = await getRelationship(relationshipId);
  if (!row) return { ok: false, error: "Relationship not found" };

  const nextType = relationshipType != null ? (String(relationshipType).trim() as RelationshipType) : undefined;

  await updateRelationship(relationshipId, {
    ...(nextType ? { relationship_type: nextType } : {}),
    status,
    remarks: parseOptionalString(formData.get("remarks")),
  });

  if (isEntityType(entityType)) revalidateEntity(entityType, entityId);
  const otherType = row.from_entity_type === entityType ? row.to_entity_type : row.from_entity_type;
  const otherId = row.from_entity_type === entityType ? row.to_entity_id : row.from_entity_id;
  if (isEntityType(otherType)) {
    const n = Number.parseInt(otherId, 10);
    if (Number.isFinite(n)) revalidateEntity(otherType, n);
  }
  return { ok: true };
}

export async function deleteEntityRelationshipAction(formData: FormData): Promise<void> {
  const relationshipId = String(formData.get("relationship_id") ?? "").trim();
  if (!relationshipId) return;

  const entity = parseEntityFromForm(formData);
  const row = await getRelationship(relationshipId);
  await deleteRelationship(relationshipId);

  if (!("error" in entity)) {
    revalidateEntity(entity.entityType, entity.entityId);
  }
  if (row && !("error" in entity)) {
    const otherType = row.from_entity_type === entity.entityType ? row.to_entity_type : row.from_entity_type;
    const otherId = row.from_entity_type === entity.entityType ? row.to_entity_id : row.from_entity_id;
    if (isEntityType(otherType)) {
      const n = Number.parseInt(otherId, 10);
      if (Number.isFinite(n)) revalidateEntity(otherType, n);
    }
  }
}
