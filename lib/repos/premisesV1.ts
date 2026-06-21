import { query } from "@/lib/db";

export type PremisesV1 = {
  premises_id: string;
  property_id: string;
  property_name_en: string | null;
  property_name_zh: string | null;
  property_type: string | null;
  centre_type: string | null;
  inventory_status: string | null;
  ownership_type: string | null;
  floor: string | null;
  unit: string | null;
  workstation_count: string | null;
  office_name: string | null;
  office_type: string | null;
  gross_area_sqft: string | null;
  net_area_sqft: string | null;
  view_type: string | null;
  windows: string | null;
  management_fee: string | null;
  government_rates: string | null;
  remarks: string | null;
  owner_company_id: string | null;
  landlord_company_id: string | null;
  current_tenant_company_id: string | null;
  operator_company_id: string | null;
  source_company_id: string | null;
  source_contact_id: string | null;
  source_contact_role: string | null;
  offer_type: string | null;
  offer_status: string | null;
  capacity_pax: number | null;
  monthly_rent: string | null;
  rent_psf: string | null;
  deposit_months: string | null;
  rent_free_period: string | null;
  contract_term_months: number | null;
  available_date: string | null;
  commission_rate: string | null;
  currency: string | null;
  asking_sale_price: string | null;
  sale_price_psf: string | null;
  negotiable_sale_price: string | null;
  negotiable_sale_price_psf: string | null;
  expected_commission: string | null;
  payout_commission: string | null;
  commission_remarks: string | null;
  source_file: string | null;
  source_url: string | null;
  operating_model: string | null;
  fit_out_condition: string | null;
  relationship_lines: import("@/lib/v1ListValues").PremisesRelationshipLine[] | null;
  last_verified_date: string | null;
  listing_remarks: string | null;
  updated_at: string;
};

const select = `
  premises_id,
  property_id,
  property_name_en, property_name_zh,
  property_type, centre_type,
  inventory_status, ownership_type,
  floor, unit, workstation_count,
  office_name, office_type,
  gross_area_sqft::text AS gross_area_sqft,
  net_area_sqft::text AS net_area_sqft,
  view_type, windows,
  management_fee::text AS management_fee,
  government_rates::text AS government_rates,
  remarks,
  owner_company_id, landlord_company_id, current_tenant_company_id, operator_company_id,
  source_company_id, source_contact_id, source_contact_role,
  offer_type, offer_status,
  capacity_pax,
  monthly_rent::text AS monthly_rent,
  rent_psf::text AS rent_psf,
  deposit_months,
  rent_free_period,
  contract_term_months,
  available_date::text AS available_date,
  commission_rate::text AS commission_rate,
  COALESCE(currency, 'HKD') AS currency,
  asking_sale_price::text AS asking_sale_price,
  sale_price_psf::text AS sale_price_psf,
  negotiable_sale_price::text AS negotiable_sale_price,
  negotiable_sale_price_psf::text AS negotiable_sale_price_psf,
  expected_commission,
  payout_commission,
  commission_remarks,
  source_file, source_url,
  operating_model,
  fit_out_condition,
  relationship_lines,
  last_verified_date::text AS last_verified_date,
  listing_remarks,
  updated_at::text AS updated_at
`;

export async function listPremisesForPropertyV1(propertyId: string): Promise<PremisesV1[]> {
  return query<PremisesV1>(
    `SELECT ${select} FROM premises_v1 WHERE property_id = $1 ORDER BY last_verified_date DESC NULLS LAST, floor ASC NULLS LAST, unit ASC NULLS LAST, premises_id ASC`,
    [propertyId],
  );
}

export async function getPremisesV1(premisesId: string): Promise<PremisesV1 | null> {
  const rows = await query<PremisesV1>(`SELECT ${select} FROM premises_v1 WHERE premises_id = $1 LIMIT 1`, [premisesId]);
  return rows[0] ?? null;
}

export type PremisesV1Patch = Partial<
  Omit<
    PremisesV1,
    | "premises_id"
    | "updated_at"
    | "gross_area_sqft"
    | "net_area_sqft"
    | "management_fee"
    | "government_rates"
    | "monthly_rent"
    | "rent_psf"
    | "asking_sale_price"
    | "sale_price_psf"
    | "negotiable_sale_price"
    | "negotiable_sale_price_psf"
    | "commission_rate"
  > & {
    gross_area_sqft?: number | null;
    net_area_sqft?: number | null;
    management_fee?: number | null;
    government_rates?: number | null;
    monthly_rent?: number | null;
    rent_psf?: number | null;
    asking_sale_price?: number | null;
    sale_price_psf?: number | null;
    negotiable_sale_price?: number | null;
    negotiable_sale_price_psf?: number | null;
    commission_rate?: string | null;
    relationship_lines?: import("@/lib/v1ListValues").PremisesRelationshipLine[] | null;
  }
>;

export async function updatePremisesV1(premisesId: string, patch: PremisesV1Patch): Promise<void> {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;
  const sets: string[] = [];
  const params: unknown[] = [premisesId];
  let i = 2;
  for (const [k, v] of entries) {
    sets.push(`${k} = $${i}`);
    params.push(k === "relationship_lines" ? JSON.stringify(v) : v);
    i++;
  }
  await query(`UPDATE premises_v1 SET ${sets.join(", ")} WHERE premises_id = $1`, params);
}

function pad4(n: number): string {
  return String(n).padStart(4, "0");
}

export async function allocatePremisesV1Id(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const rows = await query<{ premises_id: string }>(
    `SELECT premises_id FROM premises_v1
     WHERE premises_id LIKE $1
     ORDER BY premises_id DESC
     LIMIT 1`,
    [`${prefix}%`],
  );
  let seq = 1;
  const last = rows[0]?.premises_id;
  if (last) {
    const match = last.match(/-(\d{4})$/);
    if (match) seq = Number.parseInt(match[1], 10) + 1;
  }
  return `${prefix}${pad4(seq)}`;
}

export function emptyPremisesV1(propertyId: string): PremisesV1 {
  return {
    premises_id: "",
    property_id: propertyId,
    property_name_en: null,
    property_name_zh: null,
    property_type: null,
    centre_type: null,
    inventory_status: null,
    ownership_type: null,
    floor: null,
    unit: null,
    workstation_count: null,
    office_name: null,
    office_type: null,
    gross_area_sqft: null,
    net_area_sqft: null,
    view_type: null,
    windows: null,
    management_fee: null,
    government_rates: null,
    remarks: null,
    owner_company_id: null,
    landlord_company_id: null,
    current_tenant_company_id: null,
    operator_company_id: null,
    source_company_id: null,
    source_contact_id: null,
    source_contact_role: null,
    offer_type: null,
    offer_status: null,
    capacity_pax: null,
    monthly_rent: null,
    rent_psf: null,
    deposit_months: null,
    rent_free_period: null,
    contract_term_months: null,
    available_date: null,
    commission_rate: null,
    currency: "HKD",
    asking_sale_price: null,
    sale_price_psf: null,
    negotiable_sale_price: null,
    negotiable_sale_price_psf: null,
    expected_commission: null,
    payout_commission: null,
    commission_remarks: null,
    source_file: null,
    source_url: null,
    operating_model: null,
    fit_out_condition: null,
    relationship_lines: null,
    last_verified_date: null,
    listing_remarks: null,
    updated_at: "",
  };
}

export async function createPremisesV1(propertyId: string, patch: PremisesV1Patch): Promise<string> {
  const premisesId = await allocatePremisesV1Id();
  const entries = Object.entries(patch).filter(
    ([k, v]) =>
      v !== undefined &&
      v !== "" &&
      k !== "property_id" &&
      k !== "premises_id",
  );
  const columns = ["premises_id", "property_id", ...entries.map(([k]) => k)];
  const placeholders = columns.map((_, i) => `$${i + 1}`);
  const params: unknown[] = [
    premisesId,
    propertyId,
    ...entries.map(([k, v]) => (k === "relationship_lines" ? JSON.stringify(v) : v)),
  ];
  await query(
    `INSERT INTO premises_v1 (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
    params,
  );
  return premisesId;
}

export async function duplicatePremisesV1(premisesId: string): Promise<string> {
  const row = await getPremisesV1(premisesId);
  if (!row) throw new Error("Premises not found");

  const {
    premises_id: _id,
    updated_at: _updated,
    gross_area_sqft,
    net_area_sqft,
    management_fee,
    government_rates,
    monthly_rent,
    rent_psf,
    asking_sale_price,
    sale_price_psf,
    negotiable_sale_price,
    negotiable_sale_price_psf,
    commission_rate,
    ...rest
  } = row;

  const patch: PremisesV1Patch = {
    ...rest,
    gross_area_sqft: gross_area_sqft != null ? Number.parseFloat(gross_area_sqft) : null,
    net_area_sqft: net_area_sqft != null ? Number.parseFloat(net_area_sqft) : null,
    management_fee: management_fee != null ? Number.parseFloat(management_fee) : null,
    government_rates: government_rates != null ? Number.parseFloat(government_rates) : null,
    monthly_rent: monthly_rent != null ? Number.parseFloat(monthly_rent) : null,
    rent_psf: rent_psf != null ? Number.parseFloat(rent_psf) : null,
    asking_sale_price: asking_sale_price != null ? Number.parseFloat(asking_sale_price) : null,
    sale_price_psf: sale_price_psf != null ? Number.parseFloat(sale_price_psf) : null,
    negotiable_sale_price: negotiable_sale_price != null ? Number.parseFloat(negotiable_sale_price) : null,
    negotiable_sale_price_psf:
      negotiable_sale_price_psf != null ? Number.parseFloat(negotiable_sale_price_psf) : null,
    commission_rate,
  };

  return createPremisesV1(row.property_id, patch);
}

export type PremisesFlatFilters = {
  q?: string;
  city?: string;
  district?: string;
  property_type?: string;
  operating_model?: string;
  fit_out_condition?: string;
  listing_intent?: string;
  listing_status?: string;
};

export type PremisesFlatRow = {
  premises_id: string;
  property_id: string;
  building_name_en: string | null;
  city_en: string | null;
  district_en: string | null;
  floor: string | null;
  unit: string | null;
  property_type: string | null;
  operating_model: string | null;
  inventory_status: string | null;
  workstation_count: string | null;
  gross_area_sqft: string | null;
  monthly_rent: string | null;
  rent_psf: string | null;
  asking_sale_price: string | null;
  sale_price_psf: string | null;
  available_date: string | null;
  currency: string | null;
  operator_name: string | null;
};

export async function deletePremisesV1(premisesIds: string[]): Promise<void> {
  if (premisesIds.length === 0) return;
  await query(`DELETE FROM premises_v1 WHERE premises_id = ANY($1::text[])`, [premisesIds]);
}

export type PremisesListItem = PremisesV1 & {
  building_name_en: string | null;
  district_en: string | null;
  operator_name: string | null;
};

const flatJoin = `
  FROM premises_v1 p
  JOIN properties_v1 pr ON pr.property_id = p.property_id
  LEFT JOIN companies_v1 c ON c.company_id = p.operator_company_id`;

function premisesFlatWhere(filters: PremisesFlatFilters): { where: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (filters.city) {
    clauses.push(`pr.city_en = $${i++}`);
    params.push(filters.city);
  }
  if (filters.district) {
    clauses.push(`pr.district_en = $${i++}`);
    params.push(filters.district);
  }
  if (filters.property_type) {
    clauses.push(`p.property_type = $${i++}`);
    params.push(filters.property_type);
  }
  if (filters.operating_model) {
    clauses.push(`p.operating_model = $${i++}`);
    params.push(filters.operating_model);
  }
  if (filters.fit_out_condition) {
    clauses.push(`p.fit_out_condition = $${i++}`);
    params.push(filters.fit_out_condition);
  }
  if (filters.listing_intent === "For Lease") {
    clauses.push(`(p.inventory_status = $${i} OR p.inventory_status ILIKE '%rent%')`);
    params.push("For Lease");
    i++;
  } else if (filters.listing_intent === "For Sale") {
    clauses.push(`(p.inventory_status = $${i} OR p.inventory_status ILIKE '%sale%')`);
    params.push("For Sale");
    i++;
  }
  if (filters.listing_status) {
    clauses.push(`p.offer_status = $${i++}`);
    params.push(filters.listing_status);
  }
  if (filters.q) {
    const pattern = `%${filters.q}%`;
    clauses.push(`(
      pr.bldg_name_en ILIKE $${i}
      OR pr.district_en ILIKE $${i}
      OR p.floor ILIKE $${i}
      OR p.unit ILIKE $${i}
      OR p.property_name_en ILIKE $${i}
      OR c.company_name_en ILIKE $${i}
      OR TRIM(CONCAT_WS(' - ',
        NULLIF(TRIM(pr.bldg_name_en), ''),
        CASE
          WHEN NULLIF(TRIM(p.floor), '') IS NOT NULL
          THEN TRIM(p.floor) || CASE WHEN TRIM(p.floor) ~* '/f$' THEN '' ELSE '/F' END
        END,
        CASE
          WHEN NULLIF(TRIM(BOTH '#' FROM TRIM(p.unit)), '') IS NOT NULL
          THEN '#' || TRIM(BOTH '#' FROM TRIM(p.unit))
        END
      )) ILIKE $${i}
    )`);
    params.push(pattern);
    i++;
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  return { where, params };
}

export async function listPremisesFlat(filters: PremisesFlatFilters = {}): Promise<PremisesFlatRow[]> {
  const { where, params } = premisesFlatWhere(filters);
  return query<PremisesFlatRow>(
    `SELECT
       p.premises_id,
       p.property_id,
       pr.bldg_name_en AS building_name_en,
       pr.city_en,
       pr.district_en,
       p.floor,
       p.unit,
       p.property_type,
       p.operating_model,
       p.inventory_status,
       p.workstation_count,
       p.gross_area_sqft::text AS gross_area_sqft,
       p.monthly_rent::text AS monthly_rent,
       p.rent_psf::text AS rent_psf,
       p.asking_sale_price::text AS asking_sale_price,
       p.sale_price_psf::text AS sale_price_psf,
       p.available_date::text AS available_date,
       COALESCE(p.currency, 'HKD') AS currency,
       c.company_name_en AS operator_name
     ${flatJoin}
     ${where}
     ORDER BY p.last_verified_date DESC NULLS LAST, pr.bldg_name_en ASC NULLS LAST, p.floor ASC NULLS LAST, p.unit ASC NULLS LAST`,
    params,
  );
}

export async function listPremisesFullFiltered(filters: PremisesFlatFilters = {}): Promise<PremisesListItem[]> {
  const { where, params } = premisesFlatWhere(filters);
  return query<PremisesListItem>(
    `SELECT
       p.premises_id,
       p.property_id,
       p.property_name_en, p.property_name_zh,
       p.property_type, p.centre_type,
       p.inventory_status, p.ownership_type,
       p.floor, p.unit, p.workstation_count,
       p.office_name, p.office_type,
       p.gross_area_sqft::text AS gross_area_sqft,
       p.net_area_sqft::text AS net_area_sqft,
       p.view_type, p.windows,
       p.management_fee::text AS management_fee,
       p.government_rates::text AS government_rates,
       p.remarks,
       p.owner_company_id, p.landlord_company_id, p.current_tenant_company_id, p.operator_company_id,
       p.source_company_id, p.source_contact_id, p.source_contact_role,
       p.offer_type, p.offer_status,
       p.capacity_pax,
       p.monthly_rent::text AS monthly_rent,
       p.rent_psf::text AS rent_psf,
       p.deposit_months,
       p.rent_free_period,
       p.contract_term_months,
       p.available_date::text AS available_date,
       p.commission_rate::text AS commission_rate,
       COALESCE(p.currency, 'HKD') AS currency,
       p.asking_sale_price::text AS asking_sale_price,
       p.sale_price_psf::text AS sale_price_psf,
       p.negotiable_sale_price::text AS negotiable_sale_price,
       p.negotiable_sale_price_psf::text AS negotiable_sale_price_psf,
       p.expected_commission,
       p.payout_commission,
       p.commission_remarks,
       p.source_file, p.source_url,
       p.operating_model,
       p.fit_out_condition,
       p.relationship_lines,
       p.last_verified_date::text AS last_verified_date,
       p.listing_remarks,
       p.updated_at::text AS updated_at,
       pr.bldg_name_en AS building_name_en,
       pr.district_en,
       c.company_name_en AS operator_name
     ${flatJoin}
     ${where}
     ORDER BY p.last_verified_date DESC NULLS LAST, pr.bldg_name_en ASC NULLS LAST, p.floor ASC NULLS LAST, p.unit ASC NULLS LAST`,
    params,
  );
}

export async function listPremisesFilterOptions(): Promise<{
  cities: string[];
  districts: string[];
}> {
  const [cities, districts] = await Promise.all([
    query<{ v: string }>(
      `SELECT DISTINCT pr.city_en AS v FROM premises_v1 p
       JOIN properties_v1 pr ON pr.property_id = p.property_id
       WHERE pr.city_en IS NOT NULL AND pr.city_en <> ''
       ORDER BY v ASC`,
    ),
    query<{ v: string }>(
      `SELECT DISTINCT pr.district_en AS v FROM premises_v1 p
       JOIN properties_v1 pr ON pr.property_id = p.property_id
       WHERE pr.district_en IS NOT NULL AND pr.district_en <> ''
       ORDER BY v ASC`,
    ),
  ]);
  return {
    cities: cities.map((r) => r.v),
    districts: districts.map((r) => r.v),
  };
}

export async function countPremisesV1(): Promise<number> {
  const rows = await query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM premises_v1`);
  return Number.parseInt(rows[0]?.n ?? "0", 10);
}

