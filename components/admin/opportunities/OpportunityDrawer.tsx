"use client";

import { OpportunityDetailTabs } from "@/components/admin/opportunities/OpportunityDetailTabs";
import { OpportunityDrawerBody } from "@/components/admin/opportunities/OpportunityDrawerBody";
import { OpportunityDrawerHeader } from "@/components/admin/opportunities/OpportunityDrawerHeader";
import { InlineEditProvider } from "@/components/admin/inline/InlineEditProvider";
import { useResizableDrawerWidth } from "@/lib/useResizableDrawerWidth";
import type { OpportunityDrawerData } from "@/lib/repos/opportunitiesDrawer";

const overlayClass = "fixed inset-0 z-40 bg-slate-900/10 transition-opacity";

export function OpportunityDrawer({
  data,
  onClose,
}: {
  data: OpportunityDrawerData | null;
  onClose: () => void;
}) {
  const { widthVw, onResizePointerDown } = useResizableDrawerWidth();

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
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-slate-50 shadow-xl max-lg:!w-full"
        style={{ width: `min(100%, ${widthVw}vw)` }}
        role="dialog"
        aria-modal="true"
        aria-label={`Opportunity: ${opportunity.client_name}`}
      >
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize drawer"
          onPointerDown={onResizePointerDown}
          className="absolute inset-y-0 left-0 z-20 hidden w-1.5 cursor-col-resize touch-none hover:bg-emerald-500/20 lg:block"
        />
        <InlineEditProvider initialEditHighlight={false} resetKey={opportunity.id}>
          <OpportunityDrawerHeader opportunity={opportunity} onClose={onClose} />
          <div className="shrink-0 bg-white px-4 pt-2">
            <OpportunityDetailTabs opportunityId={opportunity.id} variant="drawer" />
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <OpportunityDrawerBody data={data} />
          </div>
        </InlineEditProvider>
      </aside>
    </>
  );
}
