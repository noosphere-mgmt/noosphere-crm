"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { FormEditingContext } from "@/components/admin/ModuleActionBar";
import { OpportunityOverviewFields } from "@/components/admin/opportunities/OpportunityOverviewFields";
import { OpportunityCurrentPosition } from "@/components/admin/opportunities/OpportunityCurrentPosition";
import { updateOpportunityAction } from "@/app/admin/opportunities/actions";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

export function OpportunityOverviewTab({
  data,
  initialEditMode,
  lastActivityDate,
  proposalsEnabled = false,
}: {
  data: OpportunityDetailData;
  initialEditMode?: boolean;
  lastActivityDate?: string | null;
  proposalsEnabled?: boolean;
}) {
  const { opportunity, companies, contacts } = data;
  const router = useRouter();
  const update = updateOpportunityAction.bind(null, opportunity.id);
  const formId = `opportunity-detail-${opportunity.id}`;
  const editHref = opportunityWorkspaceHref(opportunity, "overview", "edit");
  const returnTo = useMemo(
    () => opportunityWorkspaceHref(opportunity, "overview"),
    [opportunity],
  );

  async function action(formData: FormData) {
    formData.set("return_to", returnTo);
    return update(formData);
  }

  return (
    <FormEditingContext.Provider value={initialEditMode ?? false}>
      <div>
        <form
          id={formId}
          action={action}
          onDoubleClick={(event) => {
            if (initialEditMode) return;
            const target = event.target as HTMLElement;
            if (target.closest("a, button, input, select, textarea")) return;
            router.push(editHref, { scroll: false });
          }}
          title={initialEditMode ? undefined : "Double-click to edit Overview"}
        >
          <OpportunityOverviewFields
            opportunity={opportunity}
            companies={companies}
            contacts={contacts}
            sideContent={
              <OpportunityCurrentPosition data={data} proposalsEnabled={proposalsEnabled} />
            }
          />
        </form>
      </div>
    </FormEditingContext.Provider>
  );
}
