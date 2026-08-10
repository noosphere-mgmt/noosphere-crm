import { getOpportunityDocument } from "@/lib/repos/opportunityDocuments";
import { readOpportunityDocument } from "@/lib/opportunityDocumentStorage";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const id = Number.parseInt((await params).id, 10);
  if (!Number.isFinite(id)) return new Response("Not found", { status: 404 });
  const document = await getOpportunityDocument(id);
  if (!document) return new Response("Not found", { status: 404 });
  const file = await readOpportunityDocument(document.stored_file);
  if (!file) return new Response("File missing", { status: 404 });
  const safeName = document.original_name.replace(/["\r\n]/g, "_");
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": document.mime_type,
      "Content-Disposition": `inline; filename="${safeName}"`,
    },
  });
}
