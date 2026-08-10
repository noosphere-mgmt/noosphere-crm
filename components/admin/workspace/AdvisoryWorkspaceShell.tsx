"use client";

import { useState, type ReactNode } from "react";
import { WorkspaceContextPanel } from "@/components/admin/workspace/WorkspaceContextPanel";
import { useIsMobile } from "@/lib/useIsMobile";

export function AdvisoryWorkspaceShell({
  header,
  requirementStrip,
  tabs,
  children,
  contextPanel,
  showAssistToggle = true,
}: {
  header: ReactNode;
  requirementStrip?: ReactNode;
  tabs: ReactNode;
  children: ReactNode;
  contextPanel?: ReactNode;
  showAssistToggle?: boolean;
}) {
  const isMobile = useIsMobile();
  const [assistOpen, setAssistOpen] = useState(false);
  const hasContext = contextPanel != null;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="shrink-0 space-y-3">{header}</div>
      {requirementStrip ? <div className="shrink-0">{requirementStrip}</div> : null}
      <div className="flex min-h-0 flex-1 flex-col gap-0 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-10 shrink-0 bg-[var(--admin-bg,#f8fafc)] pb-0 pt-2 sm:pt-3">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0 flex-1 overflow-x-auto">{tabs}</div>
              {hasContext && showAssistToggle && isMobile ? (
                <button
                  type="button"
                  onClick={() => setAssistOpen(true)}
                  className="mb-1 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                >
                  Assist
                </button>
              ) : null}
            </div>
          </div>
          <main className="min-h-0 flex-1 py-2 sm:py-3">{children}</main>
        </div>
        {hasContext && !isMobile ? (
          <WorkspaceContextPanel open onClose={() => {}} mobile={false}>
            {contextPanel}
          </WorkspaceContextPanel>
        ) : null}
      </div>
      {hasContext && isMobile ? (
        <WorkspaceContextPanel open={assistOpen} onClose={() => setAssistOpen(false)} mobile>
          {contextPanel}
        </WorkspaceContextPanel>
      ) : null}
    </div>
  );
}
