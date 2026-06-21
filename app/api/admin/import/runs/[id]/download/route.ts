import { csvAttachmentHeaders, csvResponseBody } from "@/lib/csvEncoding";
import {
  buildImportRunDownloadCsv,
  type ImportRunDownloadKind,
} from "@/lib/import/runDownloads";

type Props = { params: Promise<{ id: string }> };

const KINDS: ImportRunDownloadKind[] = ["upload", "created", "updated", "errors"];

function resolveKind(raw: string | null): ImportRunDownloadKind | null {
  if (!raw) return null;
  return KINDS.includes(raw as ImportRunDownloadKind) ? (raw as ImportRunDownloadKind) : null;
}

export async function GET(req: Request, { params }: Props) {
  const { id: idRaw } = await params;
  const importRunId = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(importRunId)) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const kind = resolveKind(url.searchParams.get("kind"));
  if (!kind) return new Response("Invalid kind", { status: 400 });

  const result = await buildImportRunDownloadCsv(importRunId, kind);
  if (!result) return new Response("Not found", { status: 404 });

  return new Response(csvResponseBody(result.csv), {
    headers: csvAttachmentHeaders(result.filename),
  });
}
