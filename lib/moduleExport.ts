import { CSV_MEDIA_TYPE, csvResponseBody } from "@/lib/csvEncoding";
import type { ExportScope } from "@/lib/import/exportFilename";
import { buildExportFilename } from "@/lib/import/exportFilename";
import type { ImportObjectType } from "@/lib/import/types";

export async function downloadModuleExport(
  objectType: ImportObjectType,
  ids: string[],
  scope: Extract<ExportScope, "selected" | "filtered">,
): Promise<void> {
  if (ids.length === 0) return;

  const res = await fetch(`/api/admin/import/export/${objectType}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, scope }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Export failed");
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const filename =
    disposition?.match(/filename="([^"]+)"/)?.[1] ?? buildExportFilename(objectType, scope);

  // Re-wrap with explicit UTF-8 BOM type so Excel opens Chinese correctly even if proxy strips headers.
  const text = csvResponseBody(await blob.text());
  const typedBlob = new Blob([text], { type: CSV_MEDIA_TYPE });
  const url = URL.createObjectURL(typedBlob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
