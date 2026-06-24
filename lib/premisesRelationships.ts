import type { PremisesRelationshipLine } from "@/lib/v1ListValues";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import type { CompanyLookupMaps } from "@/lib/companyIdResolve";
import { resolveToV1CompanyId } from "@/lib/companyIdResolve";
import { asArray } from "@/lib/asArray";
import {
  coerceCompanyIdToSelectValue,
  type CompanyV1SelectOption,
} from "@/lib/companyV1Display";

export function relationshipLineHasContent(line: PremisesRelationshipLine): boolean {
  return Boolean(
    line.company_id?.trim() ||
      line.contact_id?.trim() ||
      line.relationship_type?.trim() ||
      line.remarks?.trim() ||
      line.partnership_mode?.trim() ||
      line.contact_role?.trim() ||
      line.source_url?.trim() ||
      line.source_file?.trim(),
  );
}

export function parseRelationshipLines(raw: unknown): PremisesRelationshipLine[] {
  return asArray<PremisesRelationshipLine>(raw);
}

/** Coerce stored relationship_lines (JSONB / legacy string) to a safe array. */
export function normalizePremisesRelationshipLines(
  raw: unknown,
): PremisesRelationshipLine[] {
  return parseRelationshipLines(raw).map((line) => ({
    relationship_type: line.relationship_type ?? "",
    company_id: line.company_id ?? null,
    contact_id: line.contact_id ?? null,
    contact_role: line.contact_role ?? null,
    partnership_mode: line.partnership_mode ?? null,
    source_url: line.source_url ?? null,
    source_file: line.source_file ?? null,
    remarks: line.remarks ?? null,
  }));
}

export function coerceRelationshipLinesForSelect(
  lines: unknown,
  companyOptions: CompanyV1SelectOption[],
): PremisesRelationshipLine[] {
  return asArray<PremisesRelationshipLine>(lines).map((line) => ({
    ...line,
    company_id: line.company_id
      ? coerceCompanyIdToSelectValue(line.company_id, companyOptions) || null
      : null,
  }));
}

/** Sync normalize using preloaded maps (audit scripts). */
export function normalizeRelationshipLines(
  lines: unknown,
  maps: CompanyLookupMaps,
): PremisesRelationshipLine[] {
  return asArray<PremisesRelationshipLine>(lines).map((line) => {
    if (!line.company_id?.trim()) return line;
    const resolved = resolveToV1CompanyId(line.company_id, maps);
    return resolved ? { ...line, company_id: resolved } : line;
  });
}

export function initialPremisesRelationshipLines(premises: PremisesV1): PremisesRelationshipLine[] {
  const stored = normalizePremisesRelationshipLines(premises.relationship_lines);
  if (stored.length > 0) return stored;

  const lines: PremisesRelationshipLine[] = [];
  const push = (
    relationship_type: string,
    company_id: string | null,
    contact_id: string | null = null,
    contact_role: string | null = null,
    partnership_mode: string | null = null,
    source_url: string | null = null,
    source_file: string | null = null,
    remarks: string | null = null,
  ) => {
    if (!company_id && !contact_id && !source_url && !source_file && !remarks) return;
    lines.push({
      relationship_type,
      company_id,
      contact_id,
      contact_role,
      partnership_mode,
      source_url,
      source_file,
      remarks,
    });
  };

  push("Operator", premises.operator_company_id);
  push("Owner", premises.owner_company_id);
  push("Landlord", premises.landlord_company_id);
  push("Current Tenant", premises.current_tenant_company_id);
  push(
    "Source Agent",
    premises.source_company_id,
    premises.source_contact_id,
    premises.source_contact_role,
    null,
    premises.source_url,
    premises.source_file,
    premises.listing_remarks,
  );

  return lines.length > 0 ? lines : [emptyRelationshipLine()];
}

export function countPremisesRelationships(premises: PremisesV1): number {
  return initialPremisesRelationshipLines(premises).filter(
    (line) =>
      Boolean(line.company_id?.trim()) ||
      Boolean(line.contact_id?.trim()) ||
      Boolean(line.remarks?.trim()) ||
      Boolean(line.partnership_mode?.trim()),
  ).length;
}

export function emptyRelationshipLine(): PremisesRelationshipLine {
  return {
    relationship_type: "",
    company_id: null,
    contact_id: null,
    contact_role: null,
    partnership_mode: null,
    source_url: null,
    source_file: null,
    remarks: null,
  };
}

function relationshipTypeKey(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function syncRelationshipColumns(lines: unknown) {
  const normalized = normalizePremisesRelationshipLines(lines);
  const find = (type: string) =>
    normalized.find((l) => relationshipTypeKey(l.relationship_type) === type.toLowerCase()) ?? null;

  const operator = find("Operator");
  const owner = find("Owner");
  const landlord = find("Landlord");
  const tenant = find("Current Tenant");
  const source = find("Source Agent") ?? find("Source Contact");
  const agency = find("Agency");
  const referrer = find("Referrer");
  const bldgMgmt = find("Bldg Mgmt");

  return {
    operator_company_id: operator?.company_id ?? null,
    owner_company_id: owner?.company_id ?? null,
    landlord_company_id: landlord?.company_id ?? null,
    current_tenant_company_id: tenant?.company_id ?? null,
    source_company_id: source?.company_id ?? referrer?.company_id ?? agency?.company_id ?? null,
    source_contact_id: source?.contact_id ?? null,
    source_contact_role: source?.contact_role ?? null,
    source_url: source?.source_url ?? null,
    source_file: source?.source_file ?? null,
  };
}
