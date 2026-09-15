import { lookupCompanyV1BusinessId, lookupCompanyV1Name } from "@/lib/companyV1Display";
import {
  isCurrentOccupantRelationshipType,
  isOwnerLandlordRelationshipType,
  normalizePremisesRelationshipLines,
} from "@/lib/premisesRelationships";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { PremisesRelationshipLine } from "@/lib/v1ListValues";

function formatFloorSegment(floor: string): string {
  const trimmed = floor.trim();
  if (!trimmed) return "";
  if (/\/f$/i.test(trimmed)) return trimmed;
  return `${trimmed}/F`;
}

export type RelatedCompanyRole =
  | "landlord"
  | "operator"
  | "occupant"
  | "source"
  | "bldg_mgmt"
  | "referrer"
  | "other";

export type PremisesRelatedCompanyLine = {
  role: RelatedCompanyRole;
  name: string;
  companyId: string | null;
  title: string;
};

const RELATED_ROLE_ORDER: RelatedCompanyRole[] = [
  "landlord",
  "operator",
  "occupant",
  "source",
  "bldg_mgmt",
  "referrer",
  "other",
];

export const RELATED_COMPANY_ROLE_TITLE: Record<RelatedCompanyRole, string> = {
  landlord: "Owner / Landlord",
  operator: "Operator",
  occupant: "Current Occupant",
  source: "Source Agent",
  bldg_mgmt: "Bldg Mgmt",
  referrer: "Referrer",
  other: "Other",
};

function relatedRoleFromType(type: string | null | undefined): RelatedCompanyRole {
  if (isOwnerLandlordRelationshipType(type)) return "landlord";
  if (isCurrentOccupantRelationshipType(type)) return "occupant";
  const key = (type ?? "").trim().toLowerCase();
  if (key === "operator") return "operator";
  if (key === "source agent" || key === "source contact" || key === "agency") return "source";
  if (key === "bldg mgmt" || key === "building management") return "bldg_mgmt";
  if (key === "referrer") return "referrer";
  return "other";
}

function formatUnitSegment(unit: string): string {
  const trimmed = unit.trim().replace(/^#+/, "");
  if (!trimmed) return "";
  return `#${trimmed}`;
}

export type PremisesRelatedCompanies = {
  operator: string | null;
  landlord: string | null;
  occupant: string | null;
  source: string | null;
};

function trimName(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

export type PremisesRelatedCompaniesSource = {
  operator_name?: string | null;
  landlord_name?: string | null;
  owner_name?: string | null;
  occupant_name?: string | null;
  source_name?: string | null;
  operator_company_id?: string | null;
  landlord_company_id?: string | null;
  owner_company_id?: string | null;
  current_tenant_company_id?: string | null;
  source_company_id?: string | null;
  relationship_lines?: PremisesRelationshipLine[] | null;
};

export function premisesRelatedCompanies(row: PremisesRelatedCompaniesSource): PremisesRelatedCompanies {
  const lines = listPremisesRelatedCompanyLines(row);
  const nameFor = (role: RelatedCompanyRole) => lines.find((line) => line.role === role)?.name ?? null;
  return {
    operator: nameFor("operator"),
    landlord: nameFor("landlord"),
    occupant: nameFor("occupant"),
    source: nameFor("source"),
  };
}

/** All related companies for the listing cell, including Source Agent and other roles. */
export function listPremisesRelatedCompanyLines(
  row: PremisesRelatedCompaniesSource,
  companies?: CompanyV1Option[] | null,
): PremisesRelatedCompanyLine[] {
  const lines: PremisesRelatedCompanyLine[] = [];
  const seen = new Set<string>();

  const push = (role: RelatedCompanyRole, companyId: string | null | undefined, name: string | null | undefined) => {
    const rawId = companyId?.trim() || null;
    const canonicalId = (rawId ? lookupCompanyV1BusinessId(companies, rawId) : null) || rawId;
    const resolved =
      trimName(name) ??
      (rawId ? lookupCompanyV1Name(companies, rawId) : null) ??
      (canonicalId ? lookupCompanyV1Name(companies, canonicalId) : null);
    if (!resolved) return;
    const identityKeys = [
      canonicalId ? `${role}:id:${canonicalId.toLowerCase()}` : null,
      `${role}:name:${resolved.toLowerCase()}`,
    ].filter((key): key is string => Boolean(key));
    if (identityKeys.some((key) => seen.has(key))) return;
    for (const key of identityKeys) seen.add(key);
    lines.push({
      role,
      name: resolved,
      companyId: canonicalId,
      title: RELATED_COMPANY_ROLE_TITLE[role],
    });
  };

  for (const line of normalizePremisesRelationshipLines(row.relationship_lines)) {
    push(relatedRoleFromType(line.relationship_type), line.company_id, null);
  }

  push("operator", row.operator_company_id, row.operator_name);
  push("landlord", row.landlord_company_id || row.owner_company_id, row.landlord_name ?? row.owner_name);
  push("occupant", row.current_tenant_company_id, row.occupant_name);
  push("source", row.source_company_id, row.source_name);

  const operator = lines.find((line) => line.role === "operator");
  const filtered = lines.filter((line) => {
    if (line.role !== "landlord" || !operator) return true;
    if (operator.companyId && line.companyId && operator.companyId === line.companyId) return false;
    return line.name !== operator.name;
  });

  return filtered.sort(
    (a, b) => RELATED_ROLE_ORDER.indexOf(a.role) - RELATED_ROLE_ORDER.indexOf(b.role),
  );
}

/** Search/sort text for the Related Companies column. */
export function formatPremisesRelatedCompaniesSearchText(
  row: PremisesRelatedCompaniesSource,
  companies?: CompanyV1Option[] | null,
): string {
  return listPremisesRelatedCompanyLines(row, companies)
    .map((line) => line.name)
    .join(" ");
}

/** Floor + unit only — for in-property premises tables (no building name). */
export function formatPremisesCompactLabel(
  floor: string | null | undefined,
  unit: string | null | undefined,
): string {
  const floorPart = formatFloorSegment(floor ?? "");
  const unitPart = formatUnitSegment(unit ?? "");
  if (floorPart && unitPart) return `${floorPart} - ${unitPart}`;
  if (floorPart) return floorPart;
  if (unitPart) return unitPart;
  return "—";
}

/** {Building Name} - {Floor}/F - #{Unit} — omits empty floor/unit segments. */
export function formatPremisesName(
  buildingName: string | null | undefined,
  floor: string | null | undefined,
  unit: string | null | undefined,
): string {
  const parts: string[] = [];

  const building = (buildingName ?? "").trim();
  if (building) parts.push(building);

  const floorPart = formatFloorSegment(floor ?? "");
  if (floorPart) parts.push(floorPart);

  const unitPart = formatUnitSegment(unit ?? "");
  if (unitPart) parts.push(unitPart);

  return parts.length > 0 ? parts.join(" - ") : "—";
}

/** Premises module list: {Building} | {Floor}/F - #{Unit} — one clickable label, building not linked separately. */
export function formatPremisesListLabel(
  buildingName: string | null | undefined,
  floor: string | null | undefined,
  unit: string | null | undefined,
): string {
  const building = (buildingName ?? "").trim();
  const compact = formatPremisesCompactLabel(floor, unit);
  if (building && compact !== "—") return `${building} | ${compact}`;
  if (building) return building;
  if (compact !== "—") return compact;
  return "—";
}

/** Market verification date for list display (YYYY-MM-DD). */
export function formatVerifiedDate(value: string | null | undefined): string {
  if (!value) return "—";
  const trimmed = value.trim();
  if (!trimmed) return "—";
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : trimmed.slice(0, 10);
}

/** Actual record modification date, shown as YYYY-MM-DD in Hong Kong time. */
export function formatPremisesUpdatedAt(value: string | null | undefined): string {
  if (!value?.trim()) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Hong_Kong",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : value.slice(0, 10);
}

export function isPremisesForSale(status: string | null | undefined): boolean {
  const lower = (status ?? "").toLowerCase();
  return status === "For Sale" || lower.includes("sale");
}

/** Parse comma/semicolon/pipe-delimited view types stored in premises_v1.view_type. */
export function parsePremisesViewTypes(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatPremisesViewTypes(values: readonly string[]): string | null {
  const joined = values.map((v) => v.trim()).filter(Boolean).join(", ");
  return joined || null;
}

/** Office type applies to office/commercial premises only. */
export function isOfficePremisesPropertyType(propertyType: string | null | undefined): boolean {
  const t = propertyType?.trim().toLowerCase() ?? "";
  return t === "office" || t === "commercial";
}
