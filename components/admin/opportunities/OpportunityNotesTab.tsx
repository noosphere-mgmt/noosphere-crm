"use client";

import { EditableRecordForm } from "@/components/admin/EditableRecordForm";
import { TextAreaField } from "@/components/admin/AdminFormFields";
import { updateOpportunityAction } from "@/app/admin/opportunities/actions";
import { opportunityPropertyType } from "@/lib/opportunityFormParsing";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

function hiddenField(name: string, value: string | number | null | undefined) {
  if (value == null || value === "") return null;
  return <input type="hidden" name={name} value={String(value)} />;
}

export function OpportunityNotesTab({ data }: { data: OpportunityDetailData }) {
  const { opportunity } = data;
  const update = updateOpportunityAction.bind(null, opportunity.id);
  const returnTo = `/admin/opportunities/${opportunity.id}?tab=notes`;
  const propertyType = opportunityPropertyType(opportunity);

  async function action(formData: FormData) {
    formData.set("return_to", returnTo);
    return update(formData);
  }

  return (
    <EditableRecordForm formId={`opportunity-notes-${opportunity.id}`} action={action} className="max-w-3xl space-y-4">
      {hiddenField("client_name", opportunity.client_name)}
      {hiddenField("lead_type", opportunity.lead_type)}
      {hiddenField("status", opportunity.status)}
      {hiddenField("sales_role", opportunity.sales_role ?? "to_lease")}
      {hiddenField("company_id", opportunity.company_id)}
      {hiddenField("primary_contact_id", opportunity.primary_contact_id)}
      {hiddenField("referrer_company_id", opportunity.referrer_company_id)}
      {hiddenField("referrer_contact_id", opportunity.referrer_contact_id)}
      {hiddenField("property_type", propertyType)}
      {hiddenField("district_preference", opportunity.district_preference)}
      {hiddenField("budget_max", opportunity.budget_max ?? opportunity.budget_min)}
      {hiddenField("required_area_sqft", opportunity.required_area_sqft)}
      {opportunity.sales_role === "to_buy" ? (
        <>
          {hiddenField("target_yield", opportunity.target_yield)}
          {hiddenField("funding_status", opportunity.funding_status)}
        </>
      ) : (
        <>
          {hiddenField("lease_term", opportunity.lease_term)}
          {hiddenField("expected_close_date", opportunity.expected_close_date?.slice(0, 10))}
          {hiddenField("required_capacity_pax", opportunity.required_capacity_pax)}
        </>
      )}
      <TextAreaField
        label="Requirement summary"
        name="requirement_summary"
        defaultValue={opportunity.requirement_summary ?? ""}
      />
      <TextAreaField label="Internal remarks" name="remarks" defaultValue={opportunity.remarks ?? ""} />
    </EditableRecordForm>
  );
}

export function OpportunityProposalsTab() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
      Proposal lines and PDF export are not built yet. Use Proposed Premises to track options manually.
    </div>
  );
}
