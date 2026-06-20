/** UTF-8 byte order mark — required for Excel to open CSV as UTF-8 on Windows. */
export const CSV_UTF8_BOM = "\uFEFF";

export const CSV_MEDIA_TYPE = "text/csv; charset=utf-8";

export function withCsvBom(content: string): string {
  return content.startsWith(CSV_UTF8_BOM) ? content : `${CSV_UTF8_BOM}${content}`;
}

/** Strip BOM whether decoded as a character or still present after UTF-8 decode. */
export function stripCsvBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

/**
 * Decode uploaded CSV bytes as UTF-8, skipping a UTF-8 BOM (EF BB BF) if present.
 */
export function decodeCsvUtf8(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let offset = 0;
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    offset = 3;
  }
  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(offset));
  return stripCsvBom(decoded);
}

/** Read a browser/server File as UTF-8 text (handles UTF-8 BOM). */
export async function readCsvFileAsUtf8(file: Blob): Promise<string> {
  return decodeCsvUtf8(await file.arrayBuffer());
}

export function escapeCsvCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Build CSV body (without BOM). Ends with a trailing newline. */
export function buildCsvContent(headers: string[], rows: string[][]): string {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

export function csvAttachmentHeaders(filename: string): Record<string, string> {
  return {
    "Content-Type": CSV_MEDIA_TYPE,
    "Content-Disposition": `attachment; filename="${filename}"`,
  };
}

/** HTTP Response body for CSV download (UTF-8 with BOM). */
export function csvResponseBody(content: string): string {
  return withCsvBom(stripCsvBom(content));
}

/** Trigger a CSV download in the browser (UTF-8 with BOM). */
export function downloadCsvInBrowser(filename: string, csvBody: string): void {
  const blob = new Blob([csvResponseBody(csvBody)], { type: CSV_MEDIA_TYPE });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
