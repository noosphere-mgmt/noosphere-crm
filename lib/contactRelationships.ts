export const CONTACT_RELATIONSHIP_TYPES = [
  { value: "agent", label: "Agent" },
  { value: "referrer", label: "Referring entity" },
] as const;

export type ContactRelationshipType = (typeof CONTACT_RELATIONSHIP_TYPES)[number]["value"];

export type ContactRelationship = {
  id: number;
  contact_id: number;
  related_company_id: number;
  relationship_type: ContactRelationshipType | string;
  notes: string | null;
  related_company_name?: string;
};

export function contactRelationshipTypeLabel(type: string): string {
  return CONTACT_RELATIONSHIP_TYPES.find((t) => t.value === type)?.label ?? type;
}
