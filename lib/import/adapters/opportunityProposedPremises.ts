import { query } from "@/lib/db";
import { genericUpdateRecord, rowToRecord } from "../adapterUtils";
import { opportunityExists, premisesExists, validateFk, validateFkText } from "../fkValidation";
import { buildNaturalKeyParts } from "../matchRecord";
import type { ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord } from "../types";

const FIELD_KEYS = [
  "opportunity_premises_id",
  "opportunity_id",
  "premises_id",
  "proposed_price",
  "tour_date",
  "status",
  "preference",
  "client_comment",
  "advisor_comment",
  "remarks",
  "expected_collect_fee",
  "collect_fee_status",
  "expected_paid_out_fee",
  "paid_out_fee_status",
  "fee_remarks",
] as const;

const SELECT = `
  id::text AS opportunity_premises_id,
  opportunity_id::text AS opportunity_id,
  premises_id,
  proposed_price::text AS proposed_price,
  tour_date::text AS tour_date,
  status, preference, client_comment, advisor_comment, remarks,
  collect_fee_amount::text AS expected_collect_fee,
  collect_fee_status,
  paid_out_fee_amount::text AS expected_paid_out_fee,
  paid_out_fee_status,
  fee_remarks
`;

function dbPatch(values: Record<string, unknown>): Record<string, unknown> {
  const p: Record<string, unknown> = { ...values };
  if ("expected_collect_fee" in values) {
    p.collect_fee_amount = values.expected_collect_fee;
    delete p.expected_collect_fee;
  }
  if ("expected_paid_out_fee" in values) {
    p.paid_out_fee_amount = values.expected_paid_out_fee;
    delete p.expected_paid_out_fee;
  }
  delete p.opportunity_premises_id;
  delete p.opportunity_id;
  delete p.premises_id;
  return p;
}

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT ${SELECT} FROM opportunity_proposed_premises WHERE ${where}`,
    params,
  );
  return rows.map((row) => rowToRecord(row, Number.parseInt(String(row.opportunity_premises_id), 10), FIELD_KEYS));
}

export const opportunityProposedPremisesImportDefinition: ImportObjectDefinition = {
  objectType: "opportunity_proposed_premises",
  tableName: "opportunity_proposed_premises",
  matchIdField: "opportunity_premises_id",
  idType: "number",

  fields: FIELD_KEYS.map((key) => ({
    key,
    label: key,
    type: key.includes("date") ? "date" : key.includes("price") || key.includes("fee") ? "number" : "string",
    matchOnly: key === "opportunity_premises_id",
    requiredOnCreate: key === "opportunity_id" || key === "premises_id" ? true : undefined,
    aliases: key === "opportunity_premises_id" ? ["id"] : undefined,
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
      key: buildNaturalKeyParts([String(values.opportunity_id ?? ""), String(values.premises_id ?? "")]),
    };
  },

  async findByNaturalKey(key) {
    const [oppId, premisesId] = key.split("|");
    return load("opportunity_id = $1 AND premises_id = $2", [Number.parseInt(oppId, 10), premisesId]);
  },

  async validateReferences(values, suppliedFields, existing) {
    const errors: string[] = [];
    const oppId = suppliedFields.has("opportunity_id") ? values.opportunity_id : existing?.values.opportunity_id;
    const premisesId = suppliedFields.has("premises_id") ? values.premises_id : existing?.values.premises_id;
    const errOpp = await validateFk("opportunity_id", oppId, opportunityExists);
    if (errOpp) errors.push(errOpp);
    const errPrem = await validateFkText("premises_id", premisesId, premisesExists);
    if (errPrem) errors.push(errPrem);
    return errors;
  },

  async createRecord(values) {
    const rows = await query<{ id: string }>(
      `INSERT INTO opportunity_proposed_premises (
         opportunity_id, premises_id, proposed_price, tour_date, status, preference,
         client_comment, advisor_comment, remarks,
         collect_fee_amount, collect_fee_status, paid_out_fee_amount, paid_out_fee_status, fee_remarks
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id::text`,
      [
        Number(values.opportunity_id),
        String(values.premises_id),
        values.proposed_price ?? null,
        values.tour_date ?? null,
        values.status ?? null,
        values.preference ?? null,
        values.client_comment ?? null,
        values.advisor_comment ?? null,
        values.remarks ?? null,
        values.expected_collect_fee ?? null,
        values.collect_fee_status ?? null,
        values.expected_paid_out_fee ?? null,
        values.paid_out_fee_status ?? null,
        values.fee_remarks ?? null,
      ],
    );
    return Number.parseInt(rows[0]!.id, 10);
  },

  async updateRecord(id, patch, ctx) {
    await genericUpdateRecord("opportunity_proposed_premises", "id", id, dbPatch(patch), ctx);
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM opportunity_proposed_premises ORDER BY id ASC`);
    return rows.map((r) => rowToRecord(r, Number.parseInt(String(r.opportunity_premises_id), 10), FIELD_KEYS).values);
  },
};
