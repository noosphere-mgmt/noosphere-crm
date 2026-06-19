"use client";

import { OpportunityDetailTabs } from "@/components/admin/opportunities/OpportunityDetailTabs";
import { OpportunityQuickViewBody } from "@/components/admin/opportunities/OpportunityDrawerBody";
import { OpportunityDrawerHeader } from "@/components/admin/opportunities/OpportunityDrawerHeader";
import type { OpportunityDrawerData } from "@/lib/repos/opportunitiesDrawer";

const overlayClass = "fixed inset-0 z-40 bg-slate-900/10 transition-opacity";
const panelClass =
  "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-slate-50 shadow-xl lg:w-[42vw] lg:max-w-[45vw]";

export function OpportunityDrawer({
  data,
  onClose,
}: {
  data: OpportunityDrawerData | null;
  onClose: () => void;
}) {
  if (!data) return null;

  const { opportunity } = data;

  return (
    <>
      <button
        type="button"
        className={overlayClass}
        aria-label="Close opportunity panel"
        onClick={onClose}
      />
      <aside
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-label={`Opportunity: ${opportunity.client_name}`}
      >
        <OpportunityDrawerHeader opportunity={opportunity} onClose={onClose} />
        <div className="shrink-0 bg-white px-4 pt-2">
          <OpportunityDetailTabs opportunityId={opportunity.id} variant="drawer" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <OpportunityQuickViewBody data={data} />
        </div>
      </aside>
    </>
  );
}
