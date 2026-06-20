import { csvAttachmentHeaders, csvResponseBody } from "@/lib/csvEncoding";
import { buildExportFilename, type ExportScope } from "@/lib/import/exportFilename";
import { exportObjectCsv } from "@/lib/import/templates";
import type { ImportObjectType } from "@/lib/import/types";
import { IMPORT_OBJECT_TYPES } from "@/lib/import/types";

type Props = { params: Promise<{ objectType: string }> };

function csvResponse(csv: string, objectType: string, scope: ExportScope): Response {
  const filename = buildExportFilename(objectType, scope);
  return new Response(csvResponseBody(csv), {
    headers: csvAttachmentHeaders(filename),
  });
}

function resolveObjectType(raw: string): ImportObjectType | null {
  return IMPORT_OBJECT_TYPES.includes(raw as ImportObjectType) ? (raw as ImportObjectType) : null;
}

function resolveScope(raw: unknown): ExportScope | null {
  if (raw === "all" || raw === "selected" || raw === "filtered") return raw;
  return null;
}

/** Export all rows (Import Workbench). */
export async function GET(_req: Request, { params }: Props) {
  const { objectType: raw } = await params;
  const objectType = resolveObjectType(raw);
  if (!objectType) return new Response("Not found", { status: 404 });

  const csv = await exportObjectCsv(objectType);
  return csvResponse(csv, objectType, "all");
}

/** Export selected or filtered rows from module listings. */
export async function POST(req: Request, { params }: Props) {
  const { objectType: raw } = await params;
  const objectType = resolveObjectType(raw);
  if (!objectType) return new Response("Not found", { status: 404 });

  const body = (await req.json().catch(() => null)) as { ids?: unknown; scope?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body!.ids.map(String).filter(Boolean) : [];
  const scope = resolveScope(body?.scope);
  if (ids.length === 0) {
    return new Response("ids required", { status: 400 });
  }
  if (!scope || scope === "all") {
    return new Response("scope must be selected or filtered", { status: 400 });
  }

  const csv = await exportObjectCsv(objectType, { ids });
  return csvResponse(csv, objectType, scope);
}
