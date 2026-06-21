import { cache } from "react";
import { query, withTransaction } from "@/lib/db";

export type CompanyV1Option = {
  company_id: string;
  company_name_en: string | null;
};

async function syncLegacyCompaniesToV1(): Promise<void> {
  await withTransaction(async (client) => {
    const rows = await client.query<{
      id: string;
      company_name: string;
      company_name_zh: string | null;
      is_active: boolean;
      created_at: string;
    }>(
      `SELECT id::text, company_name, company_name_zh, is_active, created_at::text
       FROM companies ORDER BY id ASC`,
    );

    const seqByYear = new Map<number, number>();
    for (const r of rows.rows) {
      const legacyId = Number.parseInt(r.id, 10);
      const year = Number.parseInt((r.created_at ?? "").slice(0, 4), 10) || new Date().getFullYear();
      const seq = (seqByYear.get(year) ?? 0) + 1;
      seqByYear.set(year, seq);
      const companyId = `COMP-${year}-${String(seq).padStart(4, "0")}`;

      await client.query(
        `INSERT INTO id_map_v1 (entity_type, legacy_id, new_id)
         VALUES ('company', $1, $2)
         ON CONFLICT (entity_type, legacy_id) DO UPDATE SET new_id = EXCLUDED.new_id`,
        [legacyId, companyId],
      );

      await client.query(
        `INSERT INTO companies_v1 (
           company_id, company_name_en, company_name_zh, company_status, legacy_company_id
         ) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (company_id) DO UPDATE SET
           company_name_en = EXCLUDED.company_name_en,
           company_name_zh = EXCLUDED.company_name_zh,
           company_status = EXCLUDED.company_status,
           legacy_company_id = EXCLUDED.legacy_company_id`,
        [companyId, r.company_name, r.company_name_zh, r.is_active ? "Active" : "Inactive", legacyId],
      );
    }
  });
}

export const listCompanyV1Options = cache(async function listCompanyV1Options(): Promise<CompanyV1Option[]> {
  let rows = await query<CompanyV1Option>(
    `SELECT company_id, company_name_en
     FROM companies_v1
     ORDER BY company_name_en ASC NULLS LAST, company_id ASC`,
  );
  if (rows.length === 0) {
    await syncLegacyCompaniesToV1();
    rows = await query<CompanyV1Option>(
      `SELECT company_id, company_name_en
       FROM companies_v1
       ORDER BY company_name_en ASC NULLS LAST, company_id ASC`,
    );
  }
  return rows;
});

export async function getCompanyV1NamesByIds(ids: string[]): Promise<CompanyV1Option[]> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) return [];
  return query<CompanyV1Option>(
    `SELECT company_id, company_name_en
     FROM companies_v1
     WHERE company_id = ANY($1::text[])
     ORDER BY company_name_en ASC NULLS LAST`,
    [unique],
  );
}

export async function syncLegacyCompanyToV1(
  legacyId: number,
  companyName: string,
  companyNameZh: string | null,
  isActive: boolean,
): Promise<void> {
  const mapped = await query<{ new_id: string }>(
    `SELECT new_id FROM id_map_v1 WHERE entity_type = 'company' AND legacy_id = $1`,
    [legacyId],
  );

  let companyId = mapped[0]?.new_id;
  if (!companyId) {
    const year = new Date().getFullYear();
    const seqRow = await query<{ n: number }>(
      `SELECT COUNT(*)::int + 1 AS n FROM companies_v1 WHERE company_id LIKE $1`,
      [`COMP-${year}-%`],
    );
    const seq = seqRow[0]?.n ?? 1;
    companyId = `COMP-${year}-${String(seq).padStart(4, "0")}`;

    await query(
      `INSERT INTO id_map_v1 (entity_type, legacy_id, new_id)
       VALUES ('company', $1, $2)
       ON CONFLICT (entity_type, legacy_id) DO UPDATE SET new_id = EXCLUDED.new_id`,
      [legacyId, companyId],
    );

    await query(
      `INSERT INTO companies_v1 (
         company_id, company_name_en, company_name_zh, company_status, legacy_company_id
       ) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (company_id) DO UPDATE SET
         company_name_en = EXCLUDED.company_name_en,
         company_name_zh = EXCLUDED.company_name_zh,
         company_status = EXCLUDED.company_status,
         legacy_company_id = EXCLUDED.legacy_company_id`,
      [companyId, companyName, companyNameZh, isActive ? "Active" : "Inactive", legacyId],
    );
    return;
  }

  await query(
    `UPDATE companies_v1 SET
       company_name_en = $2,
       company_name_zh = $3,
       company_status = $4,
       legacy_company_id = $5
     WHERE company_id = $1`,
    [companyId, companyName, companyNameZh, isActive ? "Active" : "Inactive", legacyId],
  );
}
