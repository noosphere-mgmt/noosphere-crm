import { query } from "@/lib/db";
import { genericUpdateRecord, rowToRecord } from "../adapterUtils";
import { buildNaturalKeyParts } from "../matchRecord";
import {
  mergeReferenceResults,
  resolveContactReference,
  resolveLegacyCompanyReference,
  resolveOpportunityReference,
} from "../referenceResolution";
import type { ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord } from "../types";

const FIELD_KEYS = [
  "opportunity_party_id",
  "opportunity_id",
  "company_id",
  "contact_id",
  "role",
  "partnership_mode",
  "fee_note",
  "collect_fee_amount",
  "collect_fee_percent",
  "paid_out_fee_amount",
  "paid_out_fee_percent",
  "remarks",
] as const;

const SELECT = `
  id::text AS opportunity_party_id,
  opportunity_id::text AS opportunity_id,
  company_id::text AS company_id,
  contact_id::text AS contact_id,
  role, partnership_mode, fee_note,
  collect_fee_amount::text AS collect_fee_amount,
  collect_fee_percent::text AS collect_fee_percent,
  paid_out_fee_amount::text AS paid_out_fee_amount,
  paid_out_fee_percent::text AS paid_out_fee_percent,
  remarks
`;

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM opportunity_parties WHERE ${where}`, params);
  return rows.map((row) => rowToRecord(row, Number.parseInt(String(row.opportunity_party_id), 10), FIELD_KEYS));
}

export const opportunityPartiesImportDefinition: ImportObjectDefinition = {
  objectType: "opportunity_parties",
  tableName: "opportunity_parties",
  matchIdField: "opportunity_party_id",
  idType: "number",

  fields: FIELD_KEYS.map((key) => ({
    key,
    label: key,
    type: key.includes("amount") || key.includes("percent") ? "number" : "string",
    matchOnly: key === "opportunity_party_id",
    requiredOnCreate: key === "opportunity_id" || key === "role" ? true : undefined,
    aliases: key === "opportunity_party_id" ? ["id"] : undefined,
  })),

  async findById(id) {
    const rows = await load("id = $1", [Number(id)]);
    return rows[0] ?? null;
  },

  async findByExternalRef() {
    return [];
  },

  buildNaturalKey(values) {
    return {
      ok: true,
      key: buildNaturalKeyParts([
        String(values.opportunity_id ?? ""),
        String(values.company_id ?? ""),
        String(values.contact_id ?? ""),
        String(values.role ?? ""),
      ]),
    };
  },

  async findByNaturalKey(key) {
    const [oppId, companyId, contactId, role] = key.split("|");
    return load(
      `opportunity_id = $1 AND coalesce(company_id::text, '') = $2
       AND coalesce(contact_id::text, '') = $3 AND role = $4`,
      [Number.parseInt(oppId, 10), companyId ?? "", contactId ?? "", role],
    );
  },

  async validateReferences(values, suppliedFields, existing, writable) {
    const oppId = suppliedFields.has("opportunity_id")
      ? values.opportunity_id
      : existing?.values.opportunity_id ?? writable.opportunity_id;
    const results = [await resolveOpportunityReference("opportunity_id", oppId, true)];
    if (suppliedFields.has("company_id") || "company_id" in writable) {
      results.push(
        await resolveLegacyCompanyReference(
          "company_id",
          values.company_id ?? writable.company_id,
          false,
        ),
      );
    }
    if (suppliedFields.has("contact_id") || "contact_id" in writable) {
      results.push(
        await resolveContactReference(
          "contact_id",
          values.contact_id ?? writable.contact_id,
          false,
        ),
      );
    }
    return mergeReferenceResults(...results);
  },

  async createRecord(values) {
    const rows = await query<{ id: string }>(
      `INSERT INTO opportunity_parties (
         opportunity_id, company_id, contact_id, role, partnership_mode, fee_note,
         collect_fee_amount, collect_fee_percent, paid_out_fee_amount, paid_out_fee_percent, remarks
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id::text`,
      [
        Number(values.opportunity_id),
        values.company_id ? Number(values.company_id) : null,
        values.contact_id ? Number(values.contact_id) : null,
        values.role ?? "",
        values.partnership_mode ?? null,
        values.fee_note ?? null,
        values.collect_fee_amount ?? null,
        values.collect_fee_percent ?? null,
        values.paid_out_fee_amount ?? null,
        values.paid_out_fee_percent ?? null,
        values.remarks ?? null,
      ],
    );
    return Number.parseInt(rows[0]!.id, 10);
  },

  async updateRecord(id, patch, ctx) {
    await genericUpdateRecord("opportunity_parties", "id", id, patch, ctx);
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM opportunity_parties ORDER BY id ASC`);
    return rows.map((r) => rowToRecord(r, Number.parseInt(String(r.opportunity_party_id), 10), FIELD_KEYS).values);
  },
};
