"use server";

import path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createOpportunityDocument, deleteOpportunityDocument, getOpportunityDocument } from "@/lib/repos/opportunityDocuments";
import { removeOpportunityDocument, saveOpportunityDocument } from "@/lib/opportunityDocumentStorage";

const CATEGORIES = new Set(["client_file", "agreement", "proposal", "property_document", "invoice", "other"]);
const MAX_BYTES = 20 * 1024 * 1024;

function detectSupportedFile(bytes: Uint8Array): { mimeType: string; extension: string } | null {
  if (bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-") return { mimeType: "application/pdf", extension: ".pdf" };
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mimeType: "image/jpeg", extension: ".jpg" };
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= png.length && png.every((value, index) => bytes[index] === value)) return { mimeType: "image/png", extension: ".png" };
  return null;
}

export async function uploadOpportunityDocumentAction(opportunityId: number, formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Select a PDF, JPG or PNG file." };
  if (file.size > MAX_BYTES) return { ok: false, error: "File must be 20 MB or smaller." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectSupportedFile(bytes);
  if (!detected) return { ok: false, error: "Only valid PDF, JPG and PNG files are supported." };

  const title = String(formData.get("title") ?? "").trim() || path.basename(file.name, path.extname(file.name));
  const rawCategory = String(formData.get("category") ?? "other");
  const category = CATEGORIES.has(rawCategory) ? rawCategory : "other";
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const storedFile = path.join(String(opportunityId), `${randomUUID()}${detected.extension}`);

  try {
    await saveOpportunityDocument(storedFile, bytes);
    await createOpportunityDocument({
      opportunity_id: opportunityId,
      title,
      category,
      original_name: file.name,
      stored_file: storedFile,
      mime_type: detected.mimeType,
      file_size: file.size,
      notes,
    });
    revalidatePath(`/admin/opportunities/${opportunityId}`);
    return { ok: true as const };
  } catch (error) {
    await removeOpportunityDocument(storedFile).catch(() => undefined);
    return { ok: false as const, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

export async function deleteOpportunityDocumentAction(documentId: number) {
  const document = await getOpportunityDocument(documentId);
  if (!document) return;
  await deleteOpportunityDocument(documentId);
  await removeOpportunityDocument(document.stored_file);
  revalidatePath(`/admin/opportunities/${document.opportunity_id}`);
}
