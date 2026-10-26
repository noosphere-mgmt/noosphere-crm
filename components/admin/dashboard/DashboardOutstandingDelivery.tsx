import Link from "next/link";
import { hasOutstandingDelivery, isServiceDeliveryOverdue, SERVICE_DELIVERY_LABELS } from "@/lib/opportunityDelivery";
import { formatOpportunityActionDate } from "@/lib/opportunityStatusModel";
import { dealWorkspaceHref } from "@/lib/dashboardLinks";
import type { Opportunity } from "@/lib/types/entities";

export function DashboardOutstandingDelivery({ deals }: { deals: Opportunity[] }) {
  const outstanding = deals.filter(hasOutstandingDelivery).sort((a,b) =>
    (a.service_due_date ?? "9999").localeCompare(b.service_due_date ?? "9999") || a.id-b.id);
  const overdue = outstanding.filter((deal) => isServiceDeliveryOverdue(deal)).length;
  return <section className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-slate-900">Outstanding Delivery <span className="text-violet-700">{outstanding.length}</span>
        {overdue ? <span className="ml-2 text-xs text-red-600">{overdue} overdue</span> : null}</h2>
      <Link href="/admin/opportunities?status=all&horizon=outstanding_delivery" className="text-xs font-semibold text-violet-700">View all</Link>
    </div>
    {!outstanding.length ? <p className="mt-1 text-xs text-slate-500">No won opportunities awaiting service delivery.</p> :
      <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{outstanding.slice(0,6).map((deal) => <li key={deal.id} className="rounded-lg bg-slate-50 px-2.5 py-2 text-xs">
        <Link href={dealWorkspaceHref(deal)} className="font-semibold text-slate-900 hover:underline">{deal.client_name}</Link>
        <p className="mt-1 text-slate-600">{SERVICE_DELIVERY_LABELS[deal.service_delivery_status ?? "not_started"]}</p>
        <p className={isServiceDeliveryOverdue(deal) ? "font-semibold text-red-600" : "text-slate-500"}>
          {deal.service_due_date ? `Due ${formatOpportunityActionDate(deal.service_due_date)}` : "Set service due date"}
        </p>
      </li>)}</ul>}
  </section>;
}
