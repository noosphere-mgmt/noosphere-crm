import { query } from "@/lib/db";
import { sqlContactDisplayName } from "@/lib/contactName";
import { genericUpdateRecord, rowToRecord } from "../adapterUtils";
import {
  sqlJoinLegacyCompany,
  sqlJoinLegacyContact,
  sqlJoinLegacyOpportunity,
} from "../lookupSql";
import { parseBigIntParam } from "../fkValidation";
import { buildNaturalKeyParts, splitNaturalKeyParts } from "../matchRecord";
import {
  mergeReferenceResults,
  resolveContactIdOrName,
  resolveLegacyCompanyIdOrName,
  resolveOpportunityIdOrName,
} from "../referenceResolution";
import type { ImportFieldDef, ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord } from "../types";

const FIELD_KEYS = [
  "opportunity_party_id",
  "opportunity_id",
  "opportunity_name",
  "company_id",
  "company_name_en",
  "contact_id",
  "contact_name",
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
  op.id::text AS opportunity_party_id,
  op.opportunity_id::text AS opportunity_id,
  o.client_name AS opportunity_name,
  op.company_id::text AS company_id,
  c.company_name AS company_name_en,
  op.contact_id::text AS contact_id,
  ${sqlContactDisplayName("ct")} AS contact_name,
  op.role,
  op.partnership_mode,
  op.fee_note,
  op.collect_fee_amount::text AS collect_fee_amount,
  op.collect_fee_percent::text AS collect_fee_percent,
  op.paid_out_fee_amount::text AS paid_out_fee_amount,
  op.paid_out_fee_percent::text AS paid_out_fee_percent,
  op.remarks
`;

const FROM = `
  opportunity_parties op
  LEFT JOIN opportunities o ON ${sqlJoinLegacyOpportunity("o", "op.opportunity_id")}
  LEFT JOIN companies c ON ${sqlJoinLegacyCompany("c", "op.company_id")}
  LEFT JOIN contacts ct ON ${sqlJoinLegacyContact("ct", "op.contact_id")}
`;

function partyFieldDef(key: (typeof FIELD_KEYS)[number]): ImportFieldDef {
  const base = { key, label: key };
  if (key === "opportunity_party_id") {
    return { ...base, type: "number", integer: true, matchOnly: true, aliases: ["id"] };
  }
  if (key === "opportunity_id") {
    return { ...base, type: "string", requiredOnCreate: true };
  }
  if (key === "opportunity_name") {
    return { ...base, type: "string", lookupOnly: true };
  }
  if (key === "company_name_en") {
    return { ...base, type: "string", lookupOnly: true, aliases: ["company_name"] };
  }
  if (key === "contact_name") {
    return { ...base, type: "string", lookupOnly: true, aliases: ["assigned_contact_name"] };
  }
  if (key === "role") {
    return { ...base, type: "string", requiredOnCreate: true };
  }
  if (key === "partnership_mode") {
    return { ...base, type: "string", aliases: ["partnership_type"] };
  }
  if (key.includes("amount") || key.includes("percent")) {
    return { ...base, type: "number" };
  }
  return { ...base, type: "string" };
}

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} WHERE ${where}`, params);
  return rows.map((row) => rowToRecord(row, Number.parseInt(String(row.opportunity_party_id), 10), FIELD_KEYS));
}

function stripLookupFields(patch: Record<string, unknown>): Record<string, unknown> {
  const p = { ...patch };
  delete p.opportunity_name;
  delete p.company_name_en;
  delete p.contact_name;
  return p;
}

export const opportunityPartiesImportDefinition: ImportObjectDefinition = {
  objectType: "opportunity_parties",
  tableName: "opportunity_parties",
  matchIdField: "opportunity_party_id",
  idType: "number",

  fields: FIELD_KEYS.map((key) => partyFieldDef(key)),

  async findById(id) {
    const rows = await load("op.id = $1", [Number(id)]);
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
    const parts = splitNaturalKeyParts(key, 4);
    if (!parts) return [];
    const [oppId, companyId, contactId, role] = parts;
    const oppIdNum = parseBigIntParam(oppId);
    if (!oppIdNum) return [];
    return load(
      `op.opportunity_id = $1 AND coalesce(op.company_id::text, '') = $2
       AND coalesce(op.contact_id::text, '') = $3 AND op.role = $4`,
      [oppIdNum, companyId ?? "", contactId ?? "", role],
    );
  },

  async validateReferences(values, suppliedFields, existing, writable) {
    const results = [
      await resolveOpportunityIdOrName(
        "opportunity_id",
        "opportunity_name",
        values,
        suppliedFields,
        existing,
        writable,
        true,
      ),
    ];
    if (
      suppliedFields.has("company_id") ||
      "company_id" in writable ||
      suppliedFields.has("company_name_en")
    ) {
      results.push(
        await resolveLegacyCompanyIdOrName(
          "company_id",
          "company_name_en",
          values,
          suppliedFields,
          existing,
          writable,
          false,
        ),
      );
    }
    if (
      suppliedFields.has("contact_id") ||
      "contact_id" in writable ||
      suppliedFields.has("contact_name")
    ) {
      results.push(
        await resolveContactIdOrName(
          "contact_id",
          "contact_name",
          values,
          suppliedFields,
          existing,
          writable,
          false,
          parseBigIntParam(
            values.company_id ?? writable.company_id ?? existing?.values.company_id,
          ),
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
        parseBigIntParam(values.opportunity_id) ?? (() => { throw new Error("opportunity_id is required"); })(),
        parseBigIntParam(values.company_id),
        parseBigIntParam(values.contact_id),
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
    await genericUpdateRecord("opportunity_parties", "id", id, stripLookupFields(patch), ctx);
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} ORDER BY op.id ASC`);
    return rows.map((r) => rowToRecord(r, Number.parseInt(String(r.opportunity_party_id), 10), FIELD_KEYS).values);
  },
};
