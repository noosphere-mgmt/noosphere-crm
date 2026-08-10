"use client";

import type { ReactNode } from "react";

export function WorkspaceAiPlaceholder({
  entityLabel,
  entityId,
}: {
  entityLabel: string;
  entityId?: string | null;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Assist</h2>
        <p className="mt-0.5 text-xs text-slate-500">Advisory assistant — coming in R4</p>
      </div>
      <div className="flex-1 space-y-4 p-4">
        {entityId ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Context: {entityLabel} {entityId}
          </p>
        ) : null}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Suggested prompts</p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="rounded-lg border border-dashed border-slate-200 px-3 py-2">Summarise this brief</li>
            <li className="rounded-lg border border-dashed border-slate-200 px-3 py-2">Find similar supply</li>
            <li className="rounded-lg border border-dashed border-slate-200 px-3 py-2">Draft proposal introduction</li>
          </ul>
        </div>
        <div className="mt-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
          AI assistant will be read-only and require your confirmation before any writes.
        </div>
      </div>
    </div>
  );
}

export function WorkspaceContextPanel({
  open,
  onClose,
  children,
  mobile = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  mobile?: boolean;
}) {
  if (!open && mobile) return null;

  if (mobile) {
    return (
      <>
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/30"
          aria-label="Close assist panel"
          onClick={onClose}
        />
        <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-xl">
          <div className="flex justify-end border-b border-slate-200 p-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
          {children}
        </aside>
      </>
    );
  }

  return (
    <aside className="hidden w-[min(100%,300px)] shrink-0 flex-col bg-white shadow-sm ring-1 ring-slate-100/80 xl:ml-4 xl:flex xl:rounded-2xl">
      {children}
    </aside>
  );
}
