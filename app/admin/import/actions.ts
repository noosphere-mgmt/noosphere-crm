"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runImportEngine } from "@/lib/import/importEngine";
import { getImportObjectDefinition } from "@/lib/import/objectRegistry";
import { autoMapColumns, parseCsv } from "@/lib/import/parseCsv";
import type { ImportObjectType } from "@/lib/import/types";
import { IMPORT_OBJECT_TYPES } from "@/lib/import/types";
import {
  createImportSession,
  getImportSession,
  markSessionCommitted,
  saveSessionPreview,
  updateSessionMapping,
} from "@/lib/repos/importSessions";
import {
  createImportRun,
  insertImportRunRows,
  updateImportRunCounts,
} from "@/lib/repos/importRuns";

const UPLOADED_BY = "admin";
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 5000;

function parseObjectType(v: string): ImportObjectType | null {
  return IMPORT_OBJECT_TYPES.includes(v as ImportObjectType) ? (v as ImportObjectType) : null;
}

function parseOptionalString(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

export async function uploadImportAction(formData: FormData) {
  const objectType = parseObjectType(String(formData.get("object_type") ?? ""));
  if (!objectType) throw new Error("Invalid object type");

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("CSV file is required");
  if (file.size > MAX_BYTES) throw new Error("File exceeds 5 MB limit");

  const text = await file.text();
  const parsed = parseCsv(text);
  if (parsed.headers.length === 0) throw new Error("CSV has no headers");
  if (parsed.rows.length === 0) throw new Error("CSV has no data rows");
  if (parsed.rows.length > MAX_ROWS) throw new Error(`CSV exceeds ${MAX_ROWS} row limit`);

  const def = getImportObjectDefinition(objectType);
  const columnMapping = autoMapColumns(
    parsed.headers,
    def.fields.map((f) => ({ key: f.key, label: f.label, aliases: f.aliases })),
  );

  const sessionId = randomUUID();
  await createImportSession({
    id: sessionId,
    object_type: objectType,
    filename: file.name,
    uploaded_by: UPLOADED_BY,
    source_system: parseOptionalString(formData.get("source_system")),
    source_file: parseOptionalString(formData.get("source_file")) ?? file.name,
    source_date: parseOptionalString(formData.get("source_date")),
    csv_headers: parsed.headers,
    column_mapping: columnMapping,
    parsed_rows: parsed.rows,
  });

  redirect(`/admin/import/sessions/${sessionId}/mapping`);
}

export async function saveMappingAndPreviewAction(sessionId: string, formData: FormData) {
  const session = await getImportSession(sessionId);
  if (!session) throw new Error("Session not found");
  if (session.status === "committed") throw new Error("Session already committed");

  const mapping: Record<string, string> = {};
  for (const header of session.csv_headers) {
    const fieldKey = String(formData.get(`map__${header}`) ?? "").trim();
    if (fieldKey && fieldKey !== "__skip__") mapping[header] = fieldKey;
  }

  await updateSessionMapping(sessionId, mapping);

  const result = await runImportEngine({
    objectType: session.object_type,
    parsed: { headers: session.csv_headers, rows: session.parsed_rows },
    columnMapping: mapping,
    mode: "dry_run",
    sessionMetadata: {
      source_system: session.source_system,
      source_file: session.source_file,
      source_date: session.source_date,
    },
  });

  await saveSessionPreview(sessionId, result.summary, result.rows);
  redirect(`/admin/import/sessions/${sessionId}/preview`);
}

export async function confirmImportAction(sessionId: string, formData: FormData) {
  const session = await getImportSession(sessionId);
  if (!session) throw new Error("Session not found");
  if (session.status === "committed") throw new Error("Session already committed");
  if (!session.preview_summary) throw new Error("Run preview first");

  const skipErrors = formData.get("skip_errors") === "on";
  const mapping = session.column_mapping;

  const importRunId = await createImportRun({
    sessionId,
    objectType: session.object_type,
    filename: session.filename,
    uploadedBy: session.uploaded_by,
    sourceSystem: session.source_system,
    sourceFile: session.source_file,
    sourceDate: session.source_date,
    columnMapping: mapping,
    summary: session.preview_summary,
  });

  const result = await runImportEngine({
    objectType: session.object_type,
    parsed: { headers: session.csv_headers, rows: session.parsed_rows },
    columnMapping: mapping,
    mode: "commit",
    importRunId,
    skipErrors,
    sessionMetadata: {
      source_system: session.source_system,
      source_file: session.source_file,
      source_date: session.source_date,
    },
  });

  await insertImportRunRows(importRunId, result.rows);
  await updateImportRunCounts(importRunId, result.summary);
  await markSessionCommitted(sessionId, importRunId);

  revalidatePath("/admin/import/history");
  revalidatePath("/admin/properties");
  revalidatePath("/admin/companies");
  revalidatePath("/admin/contacts");
  revalidatePath("/admin/opportunities");
  revalidatePath("/admin/activities");
  redirect(`/admin/import/runs/${importRunId}`);
}
