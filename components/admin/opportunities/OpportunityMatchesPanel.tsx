"use client";

import { OpportunityMatchBoard } from "@/components/admin/opportunities/OpportunityMatchBoard";

/** @deprecated Use OpportunityMatchBoard in Matches workspace tab */
export function OpportunityMatchesPanel({
  opportunityId,
  excludeIds,
}: {
  opportunityId: number;
  excludeIds: Set<string>;
}) {
  return <OpportunityMatchBoard opportunityId={opportunityId} excludeIds={excludeIds} />;
}
