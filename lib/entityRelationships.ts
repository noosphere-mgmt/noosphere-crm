export const ENTITY_TYPES = ["company", "contact"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

/** Types stored on each entity's outgoing relationship row. */
export const RELATIONSHIP_TYPES = [
  "Refers",
  "Referred By",
  "Represents",
  "Represented By",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

/** Types a user can pick when creating a relationship from the current party. */
export const CREATION_RELATIONSHIP_TYPES = ["Refers", "Represents"] as const;
export type CreationRelationshipType = (typeof CREATION_RELATIONSHIP_TYPES)[number];

export const RELATIONSHIP_STATUSES = ["Active", "Inactive"] as const;
export type RelationshipStatus = (typeof RELATIONSHIP_STATUSES)[number];

const REVERSE_RELATIONSHIP_TYPES: Record<CreationRelationshipType, RelationshipType> = {
  Refers: "Referred By",
  Represents: "Represented By",
};

export function reverseRelationshipType(type: string): RelationshipType | null {
  if (type === "Refers") return "Referred By";
  if (type === "Represents") return "Represented By";
  if (type === "Referred By") return "Refers";
  if (type === "Represented By") return "Represents";
  return null;
}

export function reverseRelationshipLabel(type: string): string {
  return reverseRelationshipType(type) ?? type;
}

export function isRelationshipType(value: string): value is RelationshipType {
  return (RELATIONSHIP_TYPES as readonly string[]).includes(value);
}

export function isCreationRelationshipType(value: string): value is CreationRelationshipType {
  return (CREATION_RELATIONSHIP_TYPES as readonly string[]).includes(value);
}

export function isRelationshipStatus(value: string): value is RelationshipStatus {
  return (RELATIONSHIP_STATUSES as readonly string[]).includes(value);
}

export function isEntityType(value: string): value is EntityType {
  return (ENTITY_TYPES as readonly string[]).includes(value);
}

export type EntityRelationshipRow = {
  relationship_id: string;
  relationship_type: string;
  related_entity_type: EntityType;
  related_entity_id: string;
  related_entity_name: string;
  status: string;
  remarks: string | null;
  start_date: string | null;
  end_date: string | null;
};

export function entityIdString(id: number): string {
  return String(id);
}

export function parseEntityId(id: string): number | null {
  const n = Number.parseInt(id, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function creationTypeToReverseType(type: CreationRelationshipType): RelationshipType {
  return REVERSE_RELATIONSHIP_TYPES[type];
}
