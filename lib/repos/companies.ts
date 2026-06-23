import { cache } from "react";
import { query } from "@/lib/db";
import { CONNECTION_COMPANY_ROLES } from "@/lib/connectionsValues";
import type { Company, CompanyRole, RelationshipStrength } from "@/lib/types/entities";

const companySelect = `
  id, company_name, company_name_zh, company_name_cn, roles,
  coverage, country, city, district,
  website, phone, email,
  industry, source, relationship_owner,
  last_contact_date::text, last_meeting_date::text, next_follow_up_date::text,
  relationship_strength, notes, is_active,
  created_at::text, updated_at::text
`;

export type CompanyInput = {
  company_name: string;
  company_name_zh?: string | null;
  company_name_cn?: string | null;
  roles?: CompanyRole[];
  coverage?: string[];
  country?: string;
  city?: string;
  district?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  industry?: string | null;
  source?: string | null;
  relationship_owner?: string | null;
  last_contact_date?: string | null;
  last_meeting_date?: string | null;
  next_follow_up_date?: string | null;
  relationship_strength?: RelationshipStrength | null;
  notes?: string | null;
  is_active?: boolean;
};

function parseRoles(roles: unknown): CompanyRole[] {
  if (!Array.isArray(roles)) return [];
  const allowed = new Set<string>([...CONNECTION_COMPANY_ROLES, "developer", "property_management", "service_provider"]);
  return roles.filter((r): r is CompanyRole => allowed.has(String(r)));
}

function parseCoverage(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map(String).filter(Boolean);
}

function companyValues(input: CompanyInput) {
  const roles = input.roles?.length ? input.roles : (["client"] as CompanyRole[]);
  return [
    input.company_name.trim(),
    input.company_name_zh?.trim() || null,
    input.company_name_cn?.trim() || null,
    roles,
    parseCoverage(input.coverage),
    input.country?.trim() || "Hong Kong",
    input.city?.trim() || "Hong Kong",
    input.district?.trim() || null,
    input.website?.trim() || null,
    input.phone?.trim() || null,
    input.email?.trim() || null,
    input.industry?.trim() || null,
    input.source?.trim() || null,
    input.relationship_owner?.trim() || null,
    input.last_contact_date?.trim() || null,
    input.last_meeting_date?.trim() || null,
    input.next_follow_up_date?.trim() || null,
    input.relationship_strength ?? null,
    input.notes?.trim() || null,
    input.is_active ?? true,
  ];
}

export async function listCompanies(roleFilter?: CompanyRole): Promise<Company[]> {
  if (roleFilter) {
    return query<Company>(
      `SELECT ${companySelect} FROM companies
       WHERE $1 = ANY(roles)
       ORDER BY company_name ASC, id ASC`,
      [roleFilter],
    );
  }
  return query<Company>(
    `SELECT ${companySelect} FROM companies ORDER BY company_name ASC, id ASC`,
  );
}

export type CompanyOption = {
  id: number;
  company_name: string;
  v1_company_id?: string | null;
};

export const listCompanyOptions = cache(async function listCompanyOptions(): Promise<CompanyOption[]> {
  return query<CompanyOption>(
    `SELECT c.id, c.company_name, m.new_id AS v1_company_id
     FROM companies c
     LEFT JOIN id_map_v1 m ON m.entity_type = 'company' AND m.legacy_id = c.id
     WHERE c.is_active = TRUE
     ORDER BY c.company_name ASC`,
  );
});

export async function listCompanyOptionsByRole(
  role?: CompanyRole,
): Promise<CompanyOption[]> {
  if (role) {
    const filtered = await query<CompanyOption>(
      `SELECT c.id, c.company_name, m.new_id AS v1_company_id
       FROM companies c
       LEFT JOIN id_map_v1 m ON m.entity_type = 'company' AND m.legacy_id = c.id
       WHERE c.is_active = TRUE AND $1 = ANY(c.roles)
       ORDER BY c.company_name ASC`,
      [role],
    );
    if (filtered.length > 0) return filtered;
  }
  return listCompanyOptions();
}

export async function getCompany(id: number): Promise<Company | null> {
  const rows = await query<Company>(
    `SELECT ${companySelect.replace(/\bid\b/g, "companies.id")}, m.new_id AS v1_company_id
     FROM companies
     LEFT JOIN id_map_v1 m ON m.entity_type = 'company' AND m.legacy_id = companies.id
     WHERE companies.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function createCompany(input: CompanyInput): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO companies (
       company_name, company_name_zh, company_name_cn, roles, coverage, country, city, district,
       website, phone, email,
       industry, source, relationship_owner,
       last_contact_date, last_meeting_date, next_follow_up_date,
       relationship_strength, notes, is_active
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
     RETURNING id::text AS id`,
    companyValues(input),
  );
  return Number.parseInt(rows[0]!.id, 10);
}

export async function updateCompany(id: number, input: CompanyInput): Promise<void> {
  await query(
    `UPDATE companies SET
       company_name = $2, company_name_zh = $3, company_name_cn = $4, roles = $5,
       coverage = $6, country = $7, city = $8, district = $9,
       website = $10, phone = $11,
       email = $12, industry = $13, source = $14, relationship_owner = $15,
       last_contact_date = $16, last_meeting_date = $17, next_follow_up_date = $18,
       relationship_strength = $19, notes = $20, is_active = $21
     WHERE id = $1`,
    [id, ...companyValues(input)],
  );
}

export async function deleteCompany(id: number): Promise<void> {
  await query(`DELETE FROM companies WHERE id = $1`, [id]);
}

export async function bulkDeleteCompanies(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await query(`DELETE FROM companies WHERE id = ANY($1::bigint[])`, [ids]);
}

export function parseCompanyRoles(values: string[]): CompanyRole[] {
  return parseRoles(values);
}

export function parseRelationshipStrength(v: string | null | undefined): RelationshipStrength | null {
  if (!v?.trim()) return null;
  const s = v.trim() as RelationshipStrength;
  return ["cold", "warm", "active", "strategic"].includes(s) ? s : null;
}
