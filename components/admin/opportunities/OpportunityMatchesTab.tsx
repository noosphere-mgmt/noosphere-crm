"use client";

import { useMemo } from "react";
import { OpportunityMatchBoard } from "@/components/admin/opportunities/OpportunityMatchBoard";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

export function OpportunityMatchesTab({ data }: { data: OpportunityDetailData }) {
  const excludeIds = useMemo(
    () => new Set(data.proposedPremises.map((r) => r.premises_id)),
    [data.proposedPremises],
  );

  return (
    <OpportunityMatchBoard
      opportunityId={data.opportunity.id}
      excludeIds={excludeIds}
    />
  );
}
