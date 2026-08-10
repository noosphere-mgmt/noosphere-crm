"use client";

import { OpportunityUnifiedTimeline } from "@/components/admin/opportunities/OpportunityUnifiedTimeline";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

export function OpportunityTimelineTab({ data }: { data: OpportunityDetailData }) {
  return <OpportunityUnifiedTimeline data={data} />;
}
