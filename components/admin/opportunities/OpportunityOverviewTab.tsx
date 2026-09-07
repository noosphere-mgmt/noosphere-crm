"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FormEditingContext, ModuleStickyEditBar } from "@/components/admin/ModuleActionBar";
import { OpportunityOverviewFields } from "@/components/admin/opportunities/OpportunityOverviewFields";
import { OpportunityCurrentPosition } from "@/components/admin/opportunities/OpportunityCurrentPosition";
import { OpportunityCommissionSection } from "@/components/admin/opportunities/OpportunityCommissionSection";
import { patchOpportunityFieldAction, updateOpportunityAction } from "@/app/admin/opportunities/actions";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

export function OpportunityOverviewTab({
  data,
  initialEditMode,
  lastActivityDate,
  proposalsEnabled = false,
  listReturnTo,
}: {
  data: OpportunityDetailData;
  initialEditMode?: boolean;
  lastActivityDate?: string | null;
  proposalsEnabled?: boolean;
  /** Listing/source page to preserve across edit ↔ view on this workspace. */
  listReturnTo?: string | null;
}) {
  const { opportunity, companies, contacts } = data;
  const router = useRouter();
  const update = updateOpportunityAction.bind(null, opportunity.id);
  const formId = `opportunity-detail-${opportunity.id}`;
  const editHref = opportunityWorkspaceHref(opportunity, "overview", "edit", listReturnTo);
  const viewHref = useMemo(
    () => opportunityWorkspaceHref(opportunity, "overview", undefined, listReturnTo),
    [opportunity, listReturnTo],
  );

  async function action(formData: FormData) {
    formData.set("return_to", viewHref);
    return update(formData);
  }

  const saveFinancialField = useCallback(
    (field: "commission_income" | "related_costs") => async (value: unknown) => {
      const result = await patchOpportunityFieldAction(
        opportunity.id,
        field,
        JSON.stringify(value),
      );
      return { ok: result.ok, error: result.ok ? undefined : result.error };
    },
    [opportunity.id],
  );

  return (
    <FormEditingContext.Provider value={initialEditMode ?? false}>
      <div className={initialEditMode ? "pt-14" : undefined}>
        <form
          id={formId}
          action={action}
          onDoubleClick={(event) => {
            if (initialEditMode) return;
            const target = event.target as HTMLElement;
            if (target.closest("a, button, input, select, textarea")) return;
            router.push(editHref, { scroll: false });
          }}
        >
          <OpportunityOverviewFields
            opportunity={opportunity}
            companies={companies}
            contacts={contacts}
            sideContent={
              <OpportunityCurrentPosition data={data} proposalsEnabled={proposalsEnabled} />
            }
            belowRequirement={
              <OpportunityCommissionSection
                opportunity={opportunity}
                onSaveField={initialEditMode ? undefined : saveFinancialField}
              />
            }
          />
        </form>
        {initialEditMode ? (
          <ModuleStickyEditBar formId={formId} onCancel={() => router.push(viewHref)} />
        ) : null}
      </div>
    </FormEditingContext.Provider>
  );
}
