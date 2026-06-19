"use client";

import { FormEditingContext } from "@/components/admin/ModuleActionBar";
import { OpportunityOverviewFields } from "@/components/admin/opportunities/OpportunityOverviewFields";
import { updateOpportunityAction } from "@/app/admin/opportunities/actions";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

export function OpportunityOverviewTab({
  data,
  initialEditMode,
  lastActivityDate,
}: {
  data: OpportunityDetailData;
  initialEditMode?: boolean;
  lastActivityDate?: string | null;
}) {
  const { opportunity, parties, companies, contacts } = data;
  const update = updateOpportunityAction.bind(null, opportunity.id);
  const returnTo = `/admin/opportunities/${opportunity.id}?tab=overview`;

  async function action(formData: FormData) {
    formData.set("return_to", returnTo);
    return update(formData);
  }

  return (
    <FormEditingContext.Provider value={initialEditMode ?? false}>
      <form id={`opportunity-detail-${opportunity.id}`} action={action}>
        <OpportunityOverviewFields
          opportunity={opportunity}
          parties={parties}
          companies={companies}
          contacts={contacts}
          lastActivityDate={lastActivityDate}
        />
      </form>
    </FormEditingContext.Provider>
  );
}
