import { COMPANY_ROLES, RELATIONSHIP_STRENGTHS } from "@/lib/lookups";
import type { CompanyRole, RelationshipStrength } from "@/lib/types/entities";

export function parseCompanyRoles(formData: FormData): CompanyRole[] {
  return formData.getAll("roles").map(String).filter((r): r is CompanyRole =>
    (COMPANY_ROLES as readonly string[]).includes(r),
  );
}

export function parseRelationshipStrengthField(v: string): RelationshipStrength | null {
  if (!v.trim()) return null;
  return (RELATIONSHIP_STRENGTHS as readonly string[]).includes(v) ? (v as RelationshipStrength) : null;
}
