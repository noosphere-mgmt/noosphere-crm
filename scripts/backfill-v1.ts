import "./ensure-env";
import { query, withTransaction, type DbClient } from "../lib/db";

type EntityType = "property" | "premises" | "company" | "contact" | "opportunity";

function pad4(n: number): string {
  return String(n).padStart(4, "0");
}

function yearFromIso(iso: string | null | undefined): number {
  const s = (iso ?? "").slice(0, 4);
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : new Date().getFullYear();
}

function formatId(prefix: string, year: number, seq: number): string {
  return `${prefix}-${year}-${pad4(seq)}`;
}

async function ensureIdMap(
  client: DbClient,
  entityType: EntityType,
  legacyId: number,
  newId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO id_map_v1 (entity_type, legacy_id, new_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (entity_type, legacy_id)
     DO UPDATE SET new_id = EXCLUDED.new_id`,
    [entityType, legacyId, newId],
  );
}

async function getMappedId(
  client: DbClient,
  entityType: EntityType,
  legacyId: number | null | undefined,
): Promise<string | null> {
  if (legacyId == null) return null;
  const rows = await client.query<{ new_id: string }>(
    `SELECT new_id FROM id_map_v1 WHERE entity_type = $1 AND legacy_id = $2`,
    [entityType, legacyId],
  );
  return rows.rows[0]?.new_id ?? null;
}

async function backfillCompanies(client: DbClient) {
  const rows = await client.query<{
    id: string;
    company_name: string;
    company_name_zh: string | null;
    website: string | null;
    phone: string | null;
    industry: string | null;
    source: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
  }>(
    `SELECT id::text AS id, company_name, company_name_zh, website, phone, industry, source, notes,
            is_active, created_at::text AS created_at
     FROM companies
     ORDER BY id ASC`,
  );

  // Deterministic: sequence per year ordered by legacy id.
  const seqByYear = new Map<number, number>();
  for (const r of rows.rows) {
    const legacyId = Number.parseInt(r.id, 10);
    const y = yearFromIso(r.created_at);
    const nextSeq = (seqByYear.get(y) ?? 0) + 1;
    seqByYear.set(y, nextSeq);
    const companyId = formatId("COMP", y, nextSeq);
    await ensureIdMap(client, "company", legacyId, companyId);

    await client.query(
      `INSERT INTO companies_v1 (
         company_id, company_name_en, company_name_zh, company_type, industry, website, main_phone,
         email_domain, billing_address, source, company_status, company_remarks, company_source, company_label,
         legacy_company_id
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,
         $8,$9,$10,$11,$12,$13,$14,
         $15
       )
       ON CONFLICT (company_id) DO UPDATE SET
         company_name_en = EXCLUDED.company_name_en,
         company_name_zh = EXCLUDED.company_name_zh,
         industry = EXCLUDED.industry,
         website = EXCLUDED.website,
         main_phone = EXCLUDED.main_phone,
         source = EXCLUDED.source,
         company_remarks = EXCLUDED.company_remarks,
         company_status = EXCLUDED.company_status,
         legacy_company_id = EXCLUDED.legacy_company_id`,
      [
        companyId,
        r.company_name,
        r.company_name_zh,
        null, // company_type: cannot infer; leave for UI/import
        r.industry,
        r.website,
        r.phone,
        null, // email_domain
        null, // billing_address
        r.source,
        r.is_active ? "Active" : "Inactive",
        r.notes,
        null, // company_source
        null, // company_label
        legacyId,
      ],
    );
  }
}

async function backfillContacts(client: DbClient) {
  const rows = await client.query<{
    id: string;
    company_id: string;
    contact_name: string;
    title: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    wechat: string | null;
    preferred_language: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
  }>(
    `SELECT id::text AS id, company_id::text AS company_id,
            contact_name, title, email, phone, whatsapp, wechat, preferred_language,
            notes, is_active, created_at::text AS created_at
     FROM contacts
     ORDER BY id ASC`,
  );

  const seqByYear = new Map<number, number>();
  for (const r of rows.rows) {
    const legacyId = Number.parseInt(r.id, 10);
    const legacyCompanyId = Number.parseInt(r.company_id, 10);
    const y = yearFromIso(r.created_at);
    const nextSeq = (seqByYear.get(y) ?? 0) + 1;
    seqByYear.set(y, nextSeq);
    const contactId = formatId("CONT", y, nextSeq);
    await ensureIdMap(client, "contact", legacyId, contactId);

    const companyId = await getMappedId(client, "company", legacyCompanyId);

    // Best-effort name split: keep everything in display_name.
    await client.query(
      `INSERT INTO contacts_v1 (
         contact_id, company_id, first_name, last_name, display_name, name_zh,
         title, mobile, email, whatsapp, wechat, preferred_language,
         contact_status, remarks, contact_source, legacy_contact_id
       ) VALUES (
         $1,$2,$3,$4,$5,$6,
         $7,$8,$9,$10,$11,$12,
         $13,$14,$15,$16
       )
       ON CONFLICT (contact_id) DO UPDATE SET
         company_id = EXCLUDED.company_id,
         display_name = EXCLUDED.display_name,
         title = EXCLUDED.title,
         mobile = EXCLUDED.mobile,
         email = EXCLUDED.email,
         whatsapp = EXCLUDED.whatsapp,
         wechat = EXCLUDED.wechat,
         preferred_language = EXCLUDED.preferred_language,
         remarks = EXCLUDED.remarks,
         contact_status = EXCLUDED.contact_status,
         legacy_contact_id = EXCLUDED.legacy_contact_id`,
      [
        contactId,
        companyId,
        null,
        null,
        r.contact_name,
        null,
        r.title,
        r.phone,
        r.email,
        r.whatsapp,
        r.wechat,
        r.preferred_language,
        r.is_active ? "Active" : "Inactive",
        r.notes,
        null,
        legacyId,
      ],
    );
  }
}

async function backfillPropertiesHeader(client: DbClient) {
  const rows = await client.query<{
    id: string;
    name_en: string;
    name_zh: string | null;
    tower_block: string | null;
    floor_count: number | null;
    year_built: number | null;
    typical_floor_area_sqft: string | null;
    country: string;
    city: string;
    district: string;
    street_no: string | null;
    street_name_en: string | null;
    street_name_zh: string | null;
    full_address_en: string;
    full_address_zh: string | null;
    lot_number: string | null;
    land_use: string | null;
    ownership_type: string | null;
    mtr_station: string | null;
    walking_minutes: number | null;
    facilities: string | null;
    green_certification: string | null;
    remarks: string | null;
    created_at: string;
  }>(
    `SELECT id::text AS id, name_en, name_zh, tower_block, floor_count, year_built,
            typical_floor_area_sqft::text AS typical_floor_area_sqft,
            country, city, district, street_no, street_name_en, street_name_zh,
            full_address_en, full_address_zh, lot_number, land_use, ownership_type,
            mtr_station, walking_minutes, facilities, green_certification, remarks,
            created_at::text AS created_at
     FROM buildings
     ORDER BY id ASC`,
  );

  const seqByYear = new Map<number, number>();
  for (const r of rows.rows) {
    const legacyId = Number.parseInt(r.id, 10);
    const y = yearFromIso(r.created_at);
    const nextSeq = (seqByYear.get(y) ?? 0) + 1;
    seqByYear.set(y, nextSeq);
    const propertyId = formatId("BLDG", y, nextSeq);
    await ensureIdMap(client, "property", legacyId, propertyId);

    await client.query(
      `INSERT INTO properties_v1 (
         property_id, bldg_name_en, bldg_name_zh, tower_block, floor_count, year_built,
         bldg_area_sqft,
         country, city_en, district_en, street_no, street_name_en, street_name_zh,
         full_address_en, full_address_zh,
         lot_number, land_use, mtr_station, walking_minutes, facilities, green_certification,
         building_remarks,
         legacy_building_id
       ) VALUES (
         $1,$2,$3,$4,$5,$6,
         $7,
         $8,$9,$10,$11,$12,$13,
         $14,$15,
         $16,$17,$18,$19,$20,$21,
         $22,
         $23
       )
       ON CONFLICT (property_id) DO UPDATE SET
         bldg_name_en = EXCLUDED.bldg_name_en,
         bldg_name_zh = EXCLUDED.bldg_name_zh,
         tower_block = EXCLUDED.tower_block,
         floor_count = EXCLUDED.floor_count,
         year_built = EXCLUDED.year_built,
         bldg_area_sqft = EXCLUDED.bldg_area_sqft,
         country = EXCLUDED.country,
         city_en = EXCLUDED.city_en,
         district_en = EXCLUDED.district_en,
         street_no = EXCLUDED.street_no,
         street_name_en = EXCLUDED.street_name_en,
         street_name_zh = EXCLUDED.street_name_zh,
         full_address_en = EXCLUDED.full_address_en,
         full_address_zh = EXCLUDED.full_address_zh,
         lot_number = EXCLUDED.lot_number,
         land_use = EXCLUDED.land_use,
         mtr_station = EXCLUDED.mtr_station,
         walking_minutes = EXCLUDED.walking_minutes,
         facilities = EXCLUDED.facilities,
         green_certification = EXCLUDED.green_certification,
         building_remarks = EXCLUDED.building_remarks,
         legacy_building_id = EXCLUDED.legacy_building_id`,
      [
        propertyId,
        r.name_en,
        r.name_zh,
        r.tower_block,
        r.floor_count,
        r.year_built,
        r.typical_floor_area_sqft ? Number.parseFloat(r.typical_floor_area_sqft) : null,
        r.country,
        r.city,
        r.district,
        r.street_no,
        r.street_name_en,
        r.street_name_zh,
        r.full_address_en,
        r.full_address_zh,
        r.lot_number,
        r.land_use,
        r.mtr_station,
        r.walking_minutes,
        r.facilities,
        r.green_certification,
        r.remarks,
        legacyId,
      ],
    );
  }
}

async function backfillPremises(client: DbClient) {
  const rows = await client.query<{
    id: string;
    building_id: string;
    floor: string | null;
    unit: string | null;
    operating_model: string;
    space_form: string;
    property_category: string;
    area_sqft: string | null;
    capacity_pax: number | null;
    asking_rent: string | null;
    asking_sale_price: string | null;
    rent_psf: string | null;
    management_fee: string | null;
    deposit_months: number | null;
    rent_free_period: string | null;
    contract_term_months: number | null;
    commission_rate: string | null;
    available_date: string | null;
    status: string;
    source: string | null;
    source_file: string | null;
    source_date: string | null;
    last_updated_date: string | null;
    remarks: string | null;
    specification: string | null;
    operator_company_id: string | null;
    landlord_company_id: string | null;
    current_tenant_company_id: string | null;
    legacy_asset_id: string | null;
    legacy_inventory_id: string | null;
    created_at: string;
  }>(
    `SELECT
        p.id::text AS id,
        p.building_id::text AS building_id,
        p.floor, p.unit,
        p.operating_model, p.space_form, p.property_category,
        p.area_sqft::text AS area_sqft,
        p.capacity_pax,
        p.asking_rent::text AS asking_rent,
        p.asking_sale_price::text AS asking_sale_price,
        p.rent_psf::text AS rent_psf,
        p.management_fee::text AS management_fee,
        p.deposit_months,
        p.rent_free_period,
        p.contract_term_months,
        p.commission_rate::text AS commission_rate,
        p.available_date::text AS available_date,
        p.status,
        p.source,
        p.source_file,
        p.source_date::text AS source_date,
        p.last_updated_date::text AS last_updated_date,
        p.remarks,
        p.specification,
        p.operator_company_id::text AS operator_company_id,
        p.landlord_company_id::text AS landlord_company_id,
        p.current_tenant_company_id::text AS current_tenant_company_id,
        p.legacy_asset_id::text AS legacy_asset_id,
        p.legacy_inventory_id::text AS legacy_inventory_id,
        p.created_at::text AS created_at
     FROM properties p
     ORDER BY p.id ASC`,
  );

  const seqByYear = new Map<number, number>();
  for (const r of rows.rows) {
    const legacyPremisesRowId = Number.parseInt(r.id, 10);
    const legacyBuildingId = Number.parseInt(r.building_id, 10);
    const y = yearFromIso(r.created_at);
    const nextSeq = (seqByYear.get(y) ?? 0) + 1;
    seqByYear.set(y, nextSeq);
    const premisesId = formatId("INV", y, nextSeq);
    await ensureIdMap(client, "premises", legacyPremisesRowId, premisesId);

    const propertyId = await getMappedId(client, "property", legacyBuildingId);
    if (!propertyId) {
      // Should not happen; keep record for manual review by skipping insert.
      continue;
    }

    // Map legacy company numeric IDs → v1 company IDs
    const opCo = r.operator_company_id ? await getMappedId(client, "company", Number.parseInt(r.operator_company_id, 10)) : null;
    const llCo = r.landlord_company_id ? await getMappedId(client, "company", Number.parseInt(r.landlord_company_id, 10)) : null;
    const tnCo = r.current_tenant_company_id ? await getMappedId(client, "company", Number.parseInt(r.current_tenant_company_id, 10)) : null;

    // Offer type best-effort: use space_form as an approximate (Floor/Unit/Enbloc) if possible.
    const offerType =
      r.space_form === "Whole Floor" ? "Floor" :
      r.space_form === "Building" || r.space_form === "Portfolio" ? "Enbloc" :
      "Unit";

    await client.query(
      `INSERT INTO premises_v1 (
         premises_id, property_id,
         property_name_en, property_name_zh, property_type, centre_type,
         inventory_status, ownership_type,
         floor, unit, workstation_count, office_name, office_type,
         gross_area_sqft, net_area_sqft, view_type, windows,
         management_fee, government_rates, remarks,
         owner_company_id, landlord_company_id, current_tenant_company_id, operator_company_id,
         source_company_id, source_contact_id, source_contact_role,
         offer_type, offer_status, capacity_pax, monthly_rent, rent_psf,
         deposit_months, rent_free_period, contract_term_months, available_date,
         commission_rate, source_file, source_url, last_verified_date, listing_remarks,
         legacy_property_row_id, legacy_asset_id, legacy_inventory_id
       ) VALUES (
         $1,$2,
         $3,$4,$5,$6,
         $7,$8,
         $9,$10,$11,$12,$13,
         $14,$15,$16,$17,
         $18,$19,$20,
         $21,$22,$23,$24,
         $25,$26,$27,
         $28,$29,$30,$31,$32,
         $33,$34,$35,$36,
         $37,$38,$39,$40,$41,
         $42,$43,$44
       )
       ON CONFLICT (premises_id) DO UPDATE SET
         property_id = EXCLUDED.property_id,
         floor = EXCLUDED.floor,
         unit = EXCLUDED.unit,
         property_type = EXCLUDED.property_type,
         centre_type = EXCLUDED.centre_type,
         inventory_status = EXCLUDED.inventory_status,
         net_area_sqft = EXCLUDED.net_area_sqft,
         capacity_pax = EXCLUDED.capacity_pax,
         monthly_rent = EXCLUDED.monthly_rent,
         rent_psf = EXCLUDED.rent_psf,
         management_fee = EXCLUDED.management_fee,
         deposit_months = EXCLUDED.deposit_months,
         rent_free_period = EXCLUDED.rent_free_period,
         contract_term_months = EXCLUDED.contract_term_months,
         available_date = EXCLUDED.available_date,
         commission_rate = EXCLUDED.commission_rate,
         offer_type = EXCLUDED.offer_type,
         offer_status = EXCLUDED.offer_status,
         operator_company_id = EXCLUDED.operator_company_id,
         landlord_company_id = EXCLUDED.landlord_company_id,
         current_tenant_company_id = EXCLUDED.current_tenant_company_id,
         listing_remarks = EXCLUDED.listing_remarks,
         legacy_property_row_id = EXCLUDED.legacy_property_row_id,
         legacy_asset_id = EXCLUDED.legacy_asset_id,
         legacy_inventory_id = EXCLUDED.legacy_inventory_id`,
      [
        premisesId,
        propertyId,
        r.specification ?? null, // property_name_en (best-effort label)
        null,
        r.property_category ?? null, // property_type (closest available)
        r.operating_model ?? null, // centre_type best-effort
        r.status ?? null, // inventory_status best-effort
        null, // ownership_type
        r.floor,
        r.unit,
        null,
        null,
        null,
        null,
        r.area_sqft ? Number.parseFloat(r.area_sqft) : null,
        null,
        null,
        r.management_fee ? Number.parseFloat(r.management_fee) : null,
        null,
        r.remarks,
        null,
        llCo,
        tnCo,
        opCo,
        null,
        null,
        null,
        offerType,
        r.status,
        r.capacity_pax,
        r.asking_rent ? Number.parseFloat(r.asking_rent) : null,
        r.rent_psf ? Number.parseFloat(r.rent_psf) : null,
        r.deposit_months,
        r.rent_free_period,
        r.contract_term_months,
        r.available_date,
        r.commission_rate ? Number.parseFloat(r.commission_rate) : null,
        r.source_file ?? r.source ?? null,
        null,
        r.last_updated_date,
        r.remarks,
        legacyPremisesRowId,
        r.legacy_asset_id ? Number.parseInt(r.legacy_asset_id, 10) : null,
        r.legacy_inventory_id ? Number.parseInt(r.legacy_inventory_id, 10) : null,
      ],
    );
  }
}

async function backfillOpportunities(client: DbClient) {
  const rows = await client.query<{
    id: string;
    client_name: string;
    company_id: string | null;
    primary_contact_id: string | null;
    budget_min: string | null;
    budget_max: string | null;
    required_area_sqft: string | null;
    required_capacity_pax: number | null;
    district_preference: string | null;
    workspace_type: string | null;
    move_in_date: string | null;
    status: string;
    requirement_summary: string | null;
    remarks: string | null;
    created_at: string;
    decision_date: string | null;
    lost_reason: string | null;
  }>(
    `SELECT
        o.id::text AS id,
        o.client_name,
        o.company_id::text AS company_id,
        o.primary_contact_id::text AS primary_contact_id,
        o.budget_min::text AS budget_min,
        o.budget_max::text AS budget_max,
        o.required_area_sqft::text AS required_area_sqft,
        o.required_capacity_pax,
        o.district_preference,
        o.workspace_type,
        o.move_in_date::text AS move_in_date,
        o.status,
        o.requirement_summary,
        o.remarks,
        o.created_at::text AS created_at,
        o.expected_close_date::text AS decision_date,
        o.lost_reason
     FROM opportunities o
     ORDER BY o.id ASC`,
  );

  const seqByYear = new Map<number, number>();
  for (const r of rows.rows) {
    const legacyId = Number.parseInt(r.id, 10);
    const y = yearFromIso(r.created_at);
    const nextSeq = (seqByYear.get(y) ?? 0) + 1;
    seqByYear.set(y, nextSeq);
    const opportunityId = formatId("OPP", y, nextSeq);
    await ensureIdMap(client, "opportunity", legacyId, opportunityId);

    const clientCompany = r.company_id ? await getMappedId(client, "company", Number.parseInt(r.company_id, 10)) : null;
    const clientContact = r.primary_contact_id ? await getMappedId(client, "contact", Number.parseInt(r.primary_contact_id, 10)) : null;

    await client.query(
      `INSERT INTO opportunities_v1 (
         opportunity_id,
         opportunity_type,
         pipeline_status,
         priority,
         client_company_id,
         client_contact_id,
         source_company_id,
         source_contact_id,
         requirement_summary,
         target_districts,
         target_capacity_pax,
         target_area_sqft,
         budget_min,
         budget_max,
         move_in_date,
         lease_term_months,
         created_date,
         next_follow_up_date,
         decision_date,
         lost_reason,
         remarks,
         legacy_opportunity_id
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
       )
       ON CONFLICT (opportunity_id) DO UPDATE SET
         client_company_id = EXCLUDED.client_company_id,
         client_contact_id = EXCLUDED.client_contact_id,
         requirement_summary = EXCLUDED.requirement_summary,
         target_districts = EXCLUDED.target_districts,
         budget_min = EXCLUDED.budget_min,
         budget_max = EXCLUDED.budget_max,
         move_in_date = EXCLUDED.move_in_date,
         pipeline_status = EXCLUDED.pipeline_status,
         remarks = EXCLUDED.remarks,
         legacy_opportunity_id = EXCLUDED.legacy_opportunity_id`,
      [
        opportunityId,
        "Client Requirement",
        r.status,
        null,
        clientCompany,
        clientContact,
        null,
        null,
        r.requirement_summary ?? r.client_name,
        r.district_preference,
        r.required_capacity_pax,
        r.required_area_sqft ? Number.parseFloat(r.required_area_sqft) : null,
        r.budget_min ? Number.parseFloat(r.budget_min) : null,
        r.budget_max ? Number.parseFloat(r.budget_max) : null,
        r.move_in_date,
        null,
        r.created_at ? r.created_at.slice(0, 10) : null,
        null,
        r.decision_date,
        r.lost_reason,
        r.remarks,
        legacyId,
      ],
    );
  }
}

async function backfillCompanyChannels(client: DbClient) {
  // Map legacy roles[] into channel lines.
  const rows = await client.query<{ id: string; roles: string[] }>(
    `SELECT id::text AS id, roles FROM companies ORDER BY id ASC`,
  );

  for (const r of rows.rows) {
    const legacyCompanyId = Number.parseInt(r.id, 10);
    const companyId = await getMappedId(client, "company", legacyCompanyId);
    if (!companyId) continue;

    const roles = Array.isArray(r.roles) ? r.roles : [];
    for (const role of roles) {
      await client.query(
        `INSERT INTO company_channel_lines_v1 (company_id, channel_type, is_primary)
         VALUES ($1, $2, FALSE)
         ON CONFLICT DO NOTHING`,
        [companyId, role],
      );
    }
  }
}

async function recomputePropertyCounts(client: DbClient) {
  await client.query(
    `UPDATE properties_v1 h SET
       inventory_count = x.total,
       inventory_count_sales = x.sales,
       inventory_count_lease = x.lease
     FROM (
       SELECT property_id,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE offer_type = 'Enbloc')::int AS sales,
              COUNT(*) FILTER (WHERE offer_type <> 'Enbloc')::int AS lease
       FROM premises_v1
       GROUP BY property_id
     ) x
     WHERE h.property_id = x.property_id`,
  );
}

async function main(): Promise<void> {
  await withTransaction(async (client) => {
    await backfillCompanies(client);
    await backfillContacts(client);
    await backfillPropertiesHeader(client);
    await backfillPremises(client);
    await backfillOpportunities(client);
    await backfillCompanyChannels(client);
    await recomputePropertyCounts(client);
  });

  console.log("Backfill v1 complete.");
}

main().catch((err) => {
  console.error("Backfill v1 failed:", err);
  process.exit(1);
});

