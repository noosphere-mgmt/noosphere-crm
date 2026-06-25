import { query } from "@/lib/db";
import { genericUpdateRecord, rowToRecord } from "../adapterUtils";
import { parseBigIntParam } from "../fkValidation";
import { sqlExportOpportunityId, sqlExportPremiseId, sqlJoinLegacyOpportunity, sqlPremisesLabel } from "../lookupSql";
import { buildNaturalKeyParts, splitNaturalKeyParts } from "../matchRecord";
import {
  mergeReferenceResults,
  resolveOpportunityIdOrName,
  resolvePremisesIdOrName,
} from "../referenceResolution";
import type { ImportFieldDef, ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord } from "../types";

const FIELD_KEYS = [
  "opportunity_premises_id",
  "opportunity_id",
  "opportunity_name",
  "premises_id",
  "premises_name",
  "building_name_en",
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
  opp.id::text AS opportunity_premises_id,
  ${sqlExportOpportunityId("opp.opportunity_id")} AS opportunity_id,
  o.client_name AS opportunity_name,
  ${sqlExportPremiseId("opp.premises_id")} AS premises_id,
  ${sqlPremisesLabel("pm", "b")} AS premises_name,
  b.bldg_name_en AS building_name_en,
  opp.proposed_price::text AS proposed_price,
  opp.tour_date::text AS tour_date,
  opp.status,
  opp.preference,
  opp.client_comment,
  opp.advisor_comment,
  opp.remarks,
  opp.collect_fee_amount::text AS expected_collect_fee,
  opp.collect_fee_status,
  opp.paid_out_fee_amount::text AS expected_paid_out_fee,
  opp.paid_out_status AS paid_out_fee_status,
  opp.fee_remarks
`;

const FROM = `
  opportunity_proposed_premises opp
  LEFT JOIN opportunities o ON ${sqlJoinLegacyOpportunity("o", "opp.opportunity_id")}
  LEFT JOIN premises_v1 pm ON pm.premises_id = opp.premises_id
  LEFT JOIN properties_v1 b ON b.property_id = pm.property_id
`;

function proposedFieldDef(key: (typeof FIELD_KEYS)[number]): ImportFieldDef {
  const base = { key, label: key };
  if (key === "opportunity_premises_id") {
    return { ...base, type: "number", integer: true, matchOnly: true, aliases: ["id"] };
  }
  if (key === "opportunity_id" || key === "premises_id") {
    return { ...base, type: "string", requiredOnCreate: true };
  }
  if (key === "opportunity_name" || key === "premises_name" || key === "building_name_en") {
    return { ...base, type: "string", lookupOnly: true };
  }
  if (key.includes("date")) return { ...base, type: "date" };
  if (key.includes("price") || key.includes("fee")) return { ...base, type: "number" };
  return { ...base, type: "string" };
}

function dbPatch(values: Record<string, unknown>): Record<string, unknown> {
  const skip = new Set([
    "opportunity_premises_id",
    "opportunity_id",
    "premises_id",
    "opportunity_name",
    "premises_name",
    "building_name_en",
  ]);
  const p: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (skip.has(k)) continue;
    if (k === "expected_collect_fee") {
      p.collect_fee_amount = v;
      continue;
    }
    if (k === "expected_paid_out_fee") {
      p.paid_out_fee_amount = v;
      continue;
    }
    if (k === "paid_out_fee_status") {
      p.paid_out_status = v;
      continue;
    }
    p[k] = v;
  }
  return p;
}

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} WHERE ${where}`, params);
  return rows.map((row) => rowToRecord(row, Number.parseInt(String(row.opportunity_premises_id), 10), FIELD_KEYS));
}

export const opportunityProposedPremisesImportDefinition: ImportObjectDefinition = {
  objectType: "opportunity_proposed_premises",
  tableName: "opportunity_proposed_premises",
  matchIdField: "opportunity_premises_id",
  idType: "number",

  fields: FIELD_KEYS.map((key) => proposedFieldDef(key)),

  async findById(id) {
    const rows = await load("opp.id = $1", [Number(id)]);
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
    const parts = splitNaturalKeyParts(key, 2);
    if (!parts) return [];
    const [oppId, premisesId] = parts;
    const oppIdNum = parseBigIntParam(oppId);
    if (!oppIdNum || !premisesId?.trim()) return [];
    return load("opp.opportunity_id = $1 AND opp.premises_id = $2", [oppIdNum, premisesId]);
  },

  async validateReferences(values, suppliedFields, existing, writable) {
    return mergeReferenceResults(
      await resolveOpportunityIdOrName(
        "opportunity_id",
        "opportunity_name",
        values,
        suppliedFields,
        existing,
        writable,
        true,
      ),
      await resolvePremisesIdOrName(
        "premises_id",
        "premises_name",
        values,
        suppliedFields,
        existing,
        writable,
        true,
      ),
    );
  },

  async createRecord(values) {
    const rows = await query<{ id: string }>(
      `INSERT INTO opportunity_proposed_premises (
         opportunity_id, premises_id, proposed_price, tour_date, status, preference,
         client_comment, advisor_comment, remarks,
         collect_fee_amount, collect_fee_status, paid_out_fee_amount, paid_out_status, fee_remarks
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id::text`,
      [
        parseBigIntParam(values.opportunity_id) ?? (() => { throw new Error("opportunity_id is required"); })(),
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
    const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} ORDER BY opp.id ASC`);
    return rows.map((r) => rowToRecord(r, Number.parseInt(String(r.opportunity_premises_id), 10), FIELD_KEYS).values);
  },
};
