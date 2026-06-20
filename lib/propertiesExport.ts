import type { PropertyListRow } from "@/components/admin/properties-v1/PropertiesFlatListClient";
import { buildCsvContent, downloadCsvInBrowser } from "@/lib/csvEncoding";

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
  downloadCsvInBrowser("properties-buildings.csv", buildCsvContent(headers, data));
}
