/**
 * Minimal UTF-8 CSV parser (quoted fields, comma-separated).
 * Accepts UTF-8 with or without BOM.
 */
import { stripCsvBom } from "@/lib/csvEncoding";

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = splitCsvLines(stripCsvBom(text));
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]!).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trim() === "") continue;
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]!] = cells[j] ?? "";
    }
    rows.push(row);
  }

  return { headers, rows };
}

function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.length > 0 || text.endsWith("\n") || text.endsWith("\r")) {
    lines.push(current);
  }
  return lines;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

export function autoMapColumns(
  csvHeaders: string[],
  fieldKeys: Array<{ key: string; label: string; aliases?: string[] }>,
): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const header of csvHeaders) {
    const norm = normalizeHeader(header);
    for (const field of fieldKeys) {
      const candidates = [field.key, field.label, ...(field.aliases ?? [])].map(normalizeHeader);
      if (candidates.includes(norm)) {
        mapping[header] = field.key;
        break;
      }
    }
  }

  return mapping;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s_-]+/g, "_");
}

export function buildTemplateCsv(headers: string[], exampleRow?: string[]): string {
  const escape = (v: string) => (v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [headers.map(escape).join(",")];
  if (exampleRow) lines.push(exampleRow.map(escape).join(","));
  return lines.join("\n") + "\n";
}
