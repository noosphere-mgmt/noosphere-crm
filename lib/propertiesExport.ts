import type { PropertyListRow } from "@/components/admin/properties-v1/PropertiesFlatListClient";

function escapeCsv(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const lines = [headers.map(escapeCsv).join(","), ...rows.map((r) => r.map(escapeCsv).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPropertiesV1Csv(rows: PropertyListRow[]): void {
  const headers = ["ID", "Building", "District", "Title", "Address", "Premises", "Updated"];
  const data = rows.map((r) => [
    r.property_id,
    r.bldg_name_en ?? "",
    r.district_en ?? "",
    r.title ?? "",
    r.full_address_en ?? "",
    String(r.inventory_count ?? 0),
    r.updated_at?.slice(0, 10) ?? "",
  ]);
  downloadCsv("properties-buildings.csv", headers, data);
}
