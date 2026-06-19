import type { ImportObjectDefinition } from "./objectRegistry";
import { resolveMatchIdValue } from "./objectRegistry";
import type { ExistingRecord, RecordId } from "./types";
import { coerceRecordId } from "./coerce";
import { normalizeKey } from "./normalize";

export type MatchResult =
  | { kind: "found"; record: ExistingRecord; method: string }
  | { kind: "not_found"; method: null }
  | { kind: "duplicate_candidate"; candidateIds: RecordId[]; method: string }
  | { kind: "error"; message: string; method: string | null };

export async function matchRecord(
  def: ImportObjectDefinition,
  values: Record<string, unknown>,
): Promise<MatchResult> {
  const rawId = resolveMatchIdValue(def, values);
  const id = coerceRecordId(rawId, def.idType);
  if (id != null) {
    const byId = await def.findById(id);
    if (!byId) {
      return { kind: "error", message: `${def.matchIdField} ${id} not found`, method: def.matchIdField };
    }
    return { kind: "found", record: byId, method: def.matchIdField };
  }

  const extRef = values.external_ref != null ? String(values.external_ref).trim() : "";
  if (extRef) {
    const matches = await def.findByExternalRef(extRef);
    if (matches.length === 1) {
      return { kind: "found", record: matches[0]!, method: "external_ref" };
    }
    if (matches.length > 1) {
      return {
        kind: "duplicate_candidate",
        candidateIds: matches.map((m) => m.id),
        method: "external_ref",
      };
    }
  }

  const natural = def.buildNaturalKey(values);
  if (!natural.ok) {
    return { kind: "not_found", method: null };
  }

  const matches = await def.findByNaturalKey(natural.key);
  if (matches.length === 1) {
    return { kind: "found", record: matches[0]!, method: "natural_key" };
  }
  if (matches.length > 1) {
    return {
      kind: "duplicate_candidate",
      candidateIds: matches.map((m) => m.id),
      method: "natural_key",
    };
  }

  return { kind: "not_found", method: null };
}

export function buildNaturalKeyParts(parts: (string | null | undefined)[]): string {
  return parts.map((p) => normalizeKey(p)).join("|");
}

export function recordIdToPreview(row: ExistingRecord | null, idType: "number" | "text") {
  if (!row) return { matched_id: null, matched_record_id: null };
  if (idType === "number") {
    return { matched_id: Number(row.id), matched_record_id: null };
  }
  return { matched_id: null, matched_record_id: String(row.id) };
}

export function candidateIdsToPreview(ids: RecordId[], idType: "number" | "text") {
  if (idType === "number") {
    return {
      candidate_ids: ids.map((id) => Number(id)),
      candidate_record_ids: null,
    };
  }
  return {
    candidate_ids: null,
    candidate_record_ids: ids.map(String),
  };
}
