import { SERVICE_DELIVERY_LABELS, isServiceDeliveryOverdue } from "@/lib/opportunityDelivery";
import { formatOpportunityActionDate } from "@/lib/opportunityStatusModel";
import type { Opportunity } from "@/lib/types/entities";

export function OpportunityDeliverySummary({ opportunity }: { opportunity: Opportunity }) {
  if (opportunity.status !== "closed_won" && !opportunity.service_due_date && opportunity.service_delivery_status !== "in_progress") return null;
  return <div className="mt-1 text-[11px] text-slate-600">
    <p>Service: {SERVICE_DELIVERY_LABELS[opportunity.service_delivery_status ?? "not_started"]}</p>
    {opportunity.service_due_date ? <p className={isServiceDeliveryOverdue(opportunity) ? "font-semibold text-red-600" : ""}>
      Due {formatOpportunityActionDate(opportunity.service_due_date)}{isServiceDeliveryOverdue(opportunity) ? " · Overdue" : ""}
    </p> : null}
  </div>;
}
