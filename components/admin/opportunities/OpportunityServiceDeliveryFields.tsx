"use client";

import { patchOpportunityFieldAction } from "@/app/admin/opportunities/actions";
import { ServiceDeliveryFormControls } from "@/components/admin/opportunities/ServiceDeliveryFormControls";
import { useFormEditing } from "@/components/admin/ModuleActionBar";
import { InlineDateField, InlineSelectField } from "@/components/admin/inline/InlineFields";
import { SERVICE_DELIVERY_STATUSES, SERVICE_DELIVERY_LABELS, isServiceDeliveryOverdue } from "@/lib/opportunityDelivery";
import type { Opportunity } from "@/lib/types/entities";

export function OpportunityServiceDeliveryFields({ opportunity }: { opportunity: Opportunity }) {
  const editing = useFormEditing();
  const status = opportunity.service_delivery_status ?? "not_started";
  const options = SERVICE_DELIVERY_STATUSES.map((value) => ({ value, label: SERVICE_DELIVERY_LABELS[value] }));
  const save = (field: string) => async (value: unknown) => {
    const result = await patchOpportunityFieldAction(opportunity.id, field, JSON.stringify(value));
    return { ok: result.ok, error: result.ok ? undefined : result.error };
  };
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Service Delivery</h2>
      <div className="space-y-3">
        {editing ? (
          <ServiceDeliveryFormControls status={status} date={opportunity.service_due_date} />
        ) : (
          <>
            <InlineSelectField label="Service Delivery" value={status} options={options} onSave={save("service_delivery_status")} />
            <InlineDateField label="Due/Complete" value={opportunity.service_due_date ?? null} onSave={save("service_due_date")} />
          </>
        )}
        {isServiceDeliveryOverdue(opportunity) ? <p className="text-xs font-semibold text-red-600">Service delivery overdue</p> : null}
      </div>
    </section>
  );
}
