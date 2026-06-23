import { query } from "@/lib/db";
import {
  resolveCompanyRefToLegacy,
  resolveCompanyRefToV1,
  resolveContactRefToLegacy,
  resolveContactRefToV1,
} from "@/lib/crmRefResolve";
import { isV1CompanyRef } from "@/lib/entityRefGuards";
import { syncLegacyCompanyToV1 } from "@/lib/repos/companiesV1";
import type { PremisesV1Patch } from "@/lib/repos/premisesV1";
import type { PropertyV1Patch } from "@/lib/repos/propertiesV1";

type FkStorage = "bigint" | "text";
type V1Table = "properties_v1" | "premises_v1";

const PROPERTIES_V1_COMPANY_COLUMNS = [
  "management_company_id",
  "operator_company_id",
  "owner_company_id",
  "current_tenant_company_id",
] as const;

const PREMISES_V1_COMPANY_COLUMNS = [
  "owner_company_id",
  "landlord_company_id",
  "current_tenant_company_id",
  "operator_company_id",
  "source_company_id",
] as const;

const PREMISES_V1_CONTACT_COLUMNS = ["source_contact_id"] as const;

let columnTypeCache: Map<string, FkStorage> | null = null;
let columnTypeCachePromise: Promise<Map<string, FkStorage>> | null = null;

function cacheKey(table: V1Table, column: string): string {
  return `${table}.${column}`;
}

async function loadFkColumnTypes(): Promise<Map<string, FkStorage>> {
  if (columnTypeCache) return columnTypeCache;
  if (!columnTypeCachePromise) {
    columnTypeCachePromise = (async () => {
      const allColumns = [
        ...PROPERTIES_V1_COMPANY_COLUMNS.map((c) => ({ table: "properties_v1" as const, column: c })),
        ...PREMISES_V1_COMPANY_COLUMNS.map((c) => ({ table: "premises_v1" as const, column: c })),
        ...PREMISES_V1_CONTACT_COLUMNS.map((c) => ({ table: "premises_v1" as const, column: c })),
      ];
      const names = [...new Set(allColumns.map((c) => c.column))];
      const rows = await query<{ table_name: string; column_name: string; data_type: string }>(
        `SELECT table_name, column_name, data_type
         FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name IN ('properties_v1', 'premises_v1')
           AND column_name = ANY($1::text[])`,
        [names],
      );
      const map = new Map<string, FkStorage>();
      for (const row of rows) {
        map.set(cacheKey(row.table_name as V1Table, row.column_name), row.data_type === "bigint" ? "bigint" : "text");
      }
      columnTypeCache = map;
      return map;
    })();
  }
  return columnTypeCachePromise;
}

/** Test helper: reset cached information_schema probe. */
export function resetPropertyV1FkColumnTypeCache(): void {
  columnTypeCache = null;
  columnTypeCachePromise = null;
}

export async function getPropertyV1FkColumnTypes(): Promise<Map<string, FkStorage>> {
  return loadFkColumnTypes();
}

function isEmptyRef(raw: unknown): boolean {
  return raw == null || String(raw).trim() === "";
}

/** TEXT FK columns reference companies_v1 — ensure row exists (id_map alone is not enough). */
async function ensureCompanyV1RowForRef(raw: unknown): Promise<void> {
  const legacyId = await resolveCompanyRefToLegacy(raw);
  if (legacyId == null) return;

  const rows = await query<{
    company_name: string;
    company_name_zh: string | null;
    is_active: boolean;
  }>(`SELECT company_name, company_name_zh, is_active FROM companies WHERE id = $1`, [legacyId]);
  const company = rows[0];
  if (!company) return;

  await syncLegacyCompanyToV1(
    legacyId,
    company.company_name,
    company.company_name_zh,
    company.is_active,
  );
}

async function coerceCompanyForColumn(
  table: V1Table,
  column: string,
  raw: unknown,
  types: Map<string, FkStorage>,
): Promise<string | number | null> {
  if (isEmptyRef(raw)) return null;
  const storage = types.get(cacheKey(table, column)) ?? "text";
  if (storage === "bigint") {
    const legacy = await resolveCompanyRefToLegacy(raw);
    if (legacy == null && !isEmptyRef(raw)) {
      throw new Error(`Could not resolve company reference for ${column}`);
    }
    return legacy;
  }

  await ensureCompanyV1RowForRef(raw);
  const v1Id = await resolveCompanyRefToV1(raw);
  if (v1Id == null && !isEmptyRef(raw)) {
    throw new Error(`Could not resolve company reference for ${column}`);
  }
  if (typeof v1Id === "string" && isV1CompanyRef(v1Id)) {
    const exists = await query<{ company_id: string }>(
      `SELECT company_id FROM companies_v1 WHERE company_id = $1 LIMIT 1`,
      [v1Id],
    );
    if (!exists[0]) {
      throw new Error(`Company ${v1Id} is not in companies_v1`);
    }
  }
  return v1Id;
}

async function coerceContactForColumn(
  table: V1Table,
  column: string,
  raw: unknown,
  types: Map<string, FkStorage>,
): Promise<string | number | null> {
  if (isEmptyRef(raw)) return null;
  const storage = types.get(cacheKey(table, column)) ?? "text";
  if (storage === "bigint") {
    return resolveContactRefToLegacy(raw);
  }
  return resolveContactRefToV1(raw);
}

/** Coerce company/contact FK values to match live DB column types before INSERT/UPDATE. */
export async function coercePropertyV1PatchForDb(patch: PropertyV1Patch): Promise<PropertyV1Patch> {
  const types = await loadFkColumnTypes();
  const out: PropertyV1Patch = { ...patch };
  for (const column of PROPERTIES_V1_COMPANY_COLUMNS) {
    if (!(column in out)) continue;
    (out as Record<string, unknown>)[column] = await coerceCompanyForColumn(
      "properties_v1",
      column,
      out[column],
      types,
    );
  }
  return out;
}

export async function coercePremisesV1PatchForDb(patch: PremisesV1Patch): Promise<PremisesV1Patch> {
  const types = await loadFkColumnTypes();
  const out: PremisesV1Patch = { ...patch };
  for (const column of PREMISES_V1_COMPANY_COLUMNS) {
    if (!(column in out)) continue;
    (out as Record<string, unknown>)[column] = await coerceCompanyForColumn(
      "premises_v1",
      column,
      out[column],
      types,
    );
  }
  for (const column of PREMISES_V1_CONTACT_COLUMNS) {
    if (!(column in out)) continue;
    (out as Record<string, unknown>)[column] = await coerceContactForColumn(
      "premises_v1",
      column,
      out[column],
      types,
    );
  }
  return out;
}

/** Debug: ordered parameter names/values as they would be sent to UPDATE properties_v1. */
export function describePropertyV1UpdateParams(
  propertyId: string,
  patch: PropertyV1Patch,
): { index: number; column: string; value: unknown }[] {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  return [
    { index: 1, column: "property_id (WHERE)", value: propertyId },
    ...entries.map(([column, value], i) => ({ index: i + 2, column, value })),
  ];
}
