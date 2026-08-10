export const BUILDING_RELATIONSHIP_ROLES = ["Owner", "Management Office", "Occupant", "Other"] as const;
export type BuildingRelationshipRole = (typeof BUILDING_RELATIONSHIP_ROLES)[number];

export type BuildingRelationshipLine = {
  role: BuildingRelationshipRole;
  company_id: string;
  remarks: string;
};

export function normalizeBuildingRelationships(value: unknown): BuildingRelationshipLine[] {
  let source = value;
  if (typeof source === "string") {
    try { source = JSON.parse(source); } catch { return []; }
  }
  if (!Array.isArray(source)) return [];
  return source.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    const role = String(item.role ?? "");
    const companyId = String(item.company_id ?? "").trim();
    if (!BUILDING_RELATIONSHIP_ROLES.includes(role as BuildingRelationshipRole) || !companyId) return [];
    return [{ role: role as BuildingRelationshipRole, company_id: companyId, remarks: String(item.remarks ?? "").trim() }];
  });
}
