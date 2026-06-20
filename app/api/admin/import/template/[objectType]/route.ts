import { csvAttachmentHeaders, csvResponseBody } from "@/lib/csvEncoding";
import { getTemplateForObject } from "@/lib/import/templates";
import type { ImportObjectType } from "@/lib/import/types";
import { IMPORT_OBJECT_TYPES } from "@/lib/import/types";

type Props = { params: Promise<{ objectType: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { objectType: raw } = await params;
  if (!IMPORT_OBJECT_TYPES.includes(raw as ImportObjectType)) {
    return new Response("Not found", { status: 404 });
  }

  const csv = getTemplateForObject(raw as ImportObjectType);
  return new Response(csvResponseBody(csv), {
    headers: csvAttachmentHeaders(`${raw}-template.csv`),
  });
}
