import type { PropertyListRow } from "@/components/admin/properties-v1/PropertiesFlatListClient";
import { formatPropertyV1AddressEn } from "@/lib/composeAddress";
import { buildCsvContent, downloadCsvInBrowser } from "@/lib/csvEncoding";
import { buildExportFilename } from "@/lib/import/exportFilename";

export function exportPropertiesV1Csv(rows: PropertyListRow[]): void {
  const headers = ["ID", "Building", "District", "Title", "Address", "Premises", "Updated"];
  const data = rows.map((r) => [
    r.property_id,
    r.bldg_name_en ?? "",
    r.district_en ?? "",
    r.title ?? "",
    formatPropertyV1AddressEn(r),
    String(r.inventory_count ?? 0),
    r.updated_at?.slice(0, 10) ?? "",
  ]);
  downloadCsvInBrowser(buildExportFilename("buildings"), buildCsvContent(headers, data));
}
