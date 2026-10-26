"use client";
import { useState } from "react";
import { SERVICE_DELIVERY_STATUSES, SERVICE_DELIVERY_LABELS, todayServiceDate, type ServiceDeliveryStatus } from "@/lib/opportunityDelivery";
import { labelClass, selectClass } from "@/components/admin/opportunities/OpportunityRequirementFields";

export function ServiceDeliveryFormControls({ status = "not_started", date, disabled = false }: {
  status?: ServiceDeliveryStatus; date?: string | null; disabled?: boolean;
}) {
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftDate, setDraftDate] = useState(date?.slice(0,10) ?? "");
  return <>
    <label className="block text-sm">
      <span className={labelClass}>Service Delivery</span>
      <select name="service_delivery_status" value={draftStatus} disabled={disabled} className={selectClass}
        onChange={(event) => {
          const next = event.target.value as ServiceDeliveryStatus;
          if (next === "completed" && draftStatus !== "completed") setDraftDate(todayServiceDate());
          setDraftStatus(next);
        }}>
        {SERVICE_DELIVERY_STATUSES.map((value) => <option key={value} value={value}>{SERVICE_DELIVERY_LABELS[value]}</option>)}
      </select>
    </label>
    <label className="block text-sm">
      <span className={labelClass}>Due/Complete</span>
      <input type="date" name="service_due_date" value={draftDate} disabled={disabled} className={selectClass}
        onChange={(event) => setDraftDate(event.target.value)} />
    </label>
  </>;
}
