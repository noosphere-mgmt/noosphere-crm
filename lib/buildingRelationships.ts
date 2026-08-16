export const BUILDING_RELATIONSHIP_ROLES = [
  "Owner/Landlord",
  "Management Office",
  "Occupant",
  "Other",
] as const;
export type BuildingRelationshipRole = (typeof BUILDING_RELATIONSHIP_ROLES)[number];

export type BuildingRelationshipLine = {
  role: BuildingRelationshipRole;
  company_id: string;
  remarks: string;
};

/** Map legacy role labels onto the current canonical set. */
export function normalizeBuildingRelationshipRole(
  role: string | null | undefined,
): BuildingRelationshipRole | null {
  const trimmed = String(role ?? "").trim();
  if (!trimmed) return null;
  if (trimmed === "Owner" || trimmed === "Landlord" || trimmed === "Owner/Landlord") {
    return "Owner/Landlord";
  }
  if ((BUILDING_RELATIONSHIP_ROLES as readonly string[]).includes(trimmed)) {
    return trimmed as BuildingRelationshipRole;
  }
  return null;
}

export function normalizeBuildingRelationships(value: unknown): BuildingRelationshipLine[] {
  let source = value;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(source)) return [];
  return source.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    const role = normalizeBuildingRelationshipRole(String(item.role ?? ""));
    const companyId = String(item.company_id ?? "").trim();
    if (!role || !companyId) return [];
    return [{ role, company_id: companyId, remarks: String(item.remarks ?? "").trim() }];
  });
}

/** Ensure legacy FK columns appear as relationship rows in the UI. */
export function mergeLegacyCompanyIdsIntoBuildingRelationships(
  value: unknown,
  legacy: {
    owner_company_id?: string | null;
    management_company_id?: string | null;
    current_tenant_company_id?: string | null;
  },
): BuildingRelationshipLine[] {
  let lines = normalizeBuildingRelationships(value);
  const ensure = (role: BuildingRelationshipRole, companyId?: string | null) => {
    const id = companyId?.trim();
    if (!id) return;
    if (lines.some((line) => line.role === role)) return;
    lines = [...lines, { role, company_id: id, remarks: "" }];
  };
  ensure("Owner/Landlord", legacy.owner_company_id);
  ensure("Management Office", legacy.management_company_id);
  ensure("Occupant", legacy.current_tenant_company_id);
  return lines;
}

/** Keep legacy FK columns in sync with relationship lines (canonical source). */
export function syncLegacyCompanyIdsFromBuildingRelationships(lines: BuildingRelationshipLine[]): {
  owner_company_id: string | null;
  management_company_id: string | null;
  current_tenant_company_id: string | null;
} {
  const find = (role: BuildingRelationshipRole) =>
    lines.find((line) => line.role === role)?.company_id?.trim() || null;
  return {
    owner_company_id: find("Owner/Landlord"),
    management_company_id: find("Management Office"),
    current_tenant_company_id: find("Occupant"),
  };
}
