import type { Opportunity } from "@/lib/types/entities";
import { OPPORTUNITY_LEAD_TYPE_LABELS, OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { formatOpportunityAreaCapacity, formatOpportunityBudget } from "@/lib/opportunitiesList";
import { buildCsvContent, downloadCsvInBrowser } from "@/lib/csvEncoding";
import { buildExportFilename } from "@/lib/import/exportFilename";

export function exportOpportunitiesCsv(opps: Opportunity[]): void {
  const headers = [
    "ID",
    "Opportunity",
    "Company",
    "Primary Contact",
    "Lead Type",
    "Requirement",
    "District",
    "Budget",
    "Status",
    "Move-in",
    "Updated",
  ];
  const rows = opps.map((o) => [
    String(o.id),
    o.client_name,
    o.linked_company_name ?? "",
    o.primary_contact_name ?? "",
    OPPORTUNITY_LEAD_TYPE_LABELS[o.lead_type] ?? o.lead_type,
    formatOpportunityAreaCapacity(o.required_area_sqft, o.required_capacity_pax).replace("—", ""),
    o.district_preference ?? "",
    formatOpportunityBudget(o.budget_max, o.budget_min).replace("—", ""),
    OPPORTUNITY_STATUS_LABELS[o.status],
    o.move_in_date?.slice(0, 10) ?? "",
    o.updated_at?.slice(0, 10) ?? "",
  ]);

  downloadCsvInBrowser(buildExportFilename("opportunities"), buildCsvContent(headers, rows));
}
