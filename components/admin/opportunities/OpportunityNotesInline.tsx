"use client";

import { useCallback } from "react";
import { patchOpportunityFieldAction } from "@/app/admin/opportunities/actions";
import { DrawerOverviewCard } from "@/components/admin/connections/DrawerOverviewCard";
import { InlineTextAreaField } from "@/components/admin/inline/InlineFields";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

export function OpportunityNotesInline({ data }: { data: OpportunityDetailData }) {
  const { opportunity } = data;

  const save = useCallback(
    (field: string) => async (value: unknown) => {
      const result = await patchOpportunityFieldAction(opportunity.id, field, JSON.stringify(value));
      return { ok: result.ok, error: result.ok ? undefined : result.error };
    },
    [opportunity.id],
  );

  return (
    <DrawerOverviewCard title="Notes" columns={1} dense={false} className="w-full">
      <InlineTextAreaField
        label="Requirement summary"
        value={opportunity.requirement_summary}
        onSave={save("requirement_summary")}
        fullWidth
      />
      <InlineTextAreaField
        label="Internal remarks"
        value={opportunity.remarks}
        onSave={save("remarks")}
        fullWidth
      />
    </DrawerOverviewCard>
  );
}
