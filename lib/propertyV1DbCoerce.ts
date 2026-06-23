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

const DB_SCHEMA = "public";

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

/**
 * Column order for a full building form save (`parsePropertyV1Form` + composed addresses).
 * On `UPDATE properties_v1`, $1 = property_id (WHERE); SET columns start at $2.
 * $31 = operator_company_id when every form field is present (including nulls).
 */
export const PROPERTY_V1_FULL_FORM_UPDATE_PARAMS = [
  "bldg_name_en",
  "bldg_name_zh",
  "bldg_name_cn",
  "floor_count",
  "bldg_area_sqft",
  "bldg_area_sqm",
  "year_built",
  "bldg_desc",
  "building_remarks",
  "country",
  "city_en",
  "city_zh",
  "city_cn",
  "district_en",
  "district_zh",
  "district_cn",
  "street_no",
  "street_name_en",
  "street_name_zh",
  "street_name_cn",
  "land_use",
  "class_of_site",
  "land_tenure",
  "plot_ratio",
  "site_area_sqft",
  "site_area_sqm",
  "lot_number",
  "grade",
  "management_company_id",
  "operator_company_id",
  "owner_company_id",
  "current_tenant_company_id",
  "title",
  "mtr_station",
  "walking_minutes",
  "facilities",
  "green_certification",
  "full_address_en",
  "full_address_zh",
  "full_address_cn",
] as const;

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
         WHERE table_schema = $1
           AND table_name IN ('properties_v1', 'premises_v1')
           AND column_name = ANY($2::text[])`,
        [DB_SCHEMA, names],
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

async function probeFkColumnStorage(
  table: V1Table,
  column: string,
  types: Map<string, FkStorage>,
): Promise<FkStorage> {
  const key = cacheKey(table, column);
  const cached = types.get(key);
  if (cached) return cached;

  const rows = await query<{ data_type: string }>(
    `SELECT data_type
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2 AND column_name = $3
     LIMIT 1`,
    [DB_SCHEMA, table, column],
  );
  const storage: FkStorage = rows[0]?.data_type === "bigint" ? "bigint" : "text";
  types.set(key, storage);
  return storage;
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

/** Never pass COMP-* to a bigint column — last-line guard even if schema probe failed. */
function guardCompanyValueForStorage(
  table: V1Table,
  column: string,
  storage: FkStorage,
  value: string | number | null,
): string | number | null {
  if (value == null) return null;
  if (storage === "bigint" && typeof value === "string" && isV1CompanyRef(value)) {
    throw new Error(
      `${table}.${column} is bigint in ${DB_SCHEMA} but coerced value is ${value}. ` +
        `Run schema-migrate-phase33 or fix FK column types.`,
    );
  }
  return value;
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
  const storage = await probeFkColumnStorage(table, column, types);
  if (storage === "bigint") {
    const legacy = await resolveCompanyRefToLegacy(raw);
    if (legacy == null && !isEmptyRef(raw)) {
      throw new Error(`Could not resolve company reference for ${table}.${column}`);
    }
    return guardCompanyValueForStorage(table, column, storage, legacy);
  }

  await ensureCompanyV1RowForRef(raw);
  const v1Id = await resolveCompanyRefToV1(raw);
  if (v1Id == null && !isEmptyRef(raw)) {
    throw new Error(`Could not resolve company reference for ${table}.${column}`);
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
  return guardCompanyValueForStorage(table, column, storage, v1Id);
}

async function coerceContactForColumn(
  table: V1Table,
  column: string,
  raw: unknown,
  types: Map<string, FkStorage>,
): Promise<string | number | null> {
  if (isEmptyRef(raw)) return null;
  const storage = await probeFkColumnStorage(table, column, types);
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

export type SqlParamDescription = { index: number; column: string; value: unknown };

/** Ordered parameter names/values as sent to UPDATE properties_v1. */
export function describePropertyV1UpdateParams(
  propertyId: string,
  patch: PropertyV1Patch,
): SqlParamDescription[] {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  return [
    { index: 1, column: "property_id (WHERE)", value: propertyId },
    ...entries.map(([column, value], i) => ({ index: i + 2, column, value })),
  ];
}

export function describeV1UpdateParams(
  idColumn: string,
  id: string,
  patch: Record<string, unknown>,
): SqlParamDescription[] {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  return [
    { index: 1, column: `${idColumn} (WHERE)`, value: id },
    ...entries.map(([column, value], i) => ({ index: i + 2, column, value })),
  ];
}

export function formatSqlParamDebug(params: SqlParamDescription[]): string {
  return params.map((p) => `$${p.index}=${p.column}=${JSON.stringify(p.value)}`).join("; ");
}

export function fullFormParamIndex(column: string): number | null {
  const idx = PROPERTY_V1_FULL_FORM_UPDATE_PARAMS.indexOf(column as (typeof PROPERTY_V1_FULL_FORM_UPDATE_PARAMS)[number]);
  return idx >= 0 ? idx + 2 : null;
}
