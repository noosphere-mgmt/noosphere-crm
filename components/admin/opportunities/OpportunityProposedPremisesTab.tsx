"use client";

import { useMemo, useState, useTransition } from "react";
import { addProposedPremisesAction, deleteProposedPremisesAction } from "@/app/admin/opportunities/workspaceActions";
import { IconTrash } from "@/components/admin/ModuleActionIcons";
import { moduleActionButtonClass } from "@/components/admin/ModuleActionBar";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { PremisesSelectorModal } from "@/components/admin/opportunities/PremisesSelectorModal";
import { ProposedPremisesLinePanel } from "@/components/admin/opportunities/ProposedPremisesLinePanel";
import { ProposedPremisesListRow } from "@/components/admin/opportunities/ProposedPremisesListRow";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

export function OpportunityProposedPremisesTab({ data }: { data: OpportunityDetailData }) {
  const theme = moduleAccentClasses("opportunities");
  const { opportunity, proposedPremises } = data;
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [pending, startTransition] = useTransition();

  const selectedLine = useMemo(
    () => proposedPremises.find((r) => r.id === selectedLineId) ?? null,
    [proposedPremises, selectedLineId],
  );

  const existingPremisesIds = useMemo(
    () => new Set(proposedPremises.map((r) => r.premises_id)),
    [proposedPremises],
  );

  function toggleRow(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    const fd = new FormData();
    fd.set("line_ids", [...selectedIds].join(","));
    startTransition(async () => {
      await deleteProposedPremisesAction(opportunity.id, fd);
      setSelectedIds(new Set());
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setSelectorOpen(true)} className={theme.primaryButton}>
          + Add Premises
        </button>
        {selectedIds.size > 0 ? (
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={pending}
            className={`${moduleActionButtonClass.delete} disabled:cursor-not-allowed disabled:opacity-40`}
            aria-label="Remove selected"
            title="Remove selected"
          >
            <IconTrash />
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="w-10 px-3 py-1.5" />
              <th className="px-3 py-1.5 font-medium">Premises</th>
              <th className="px-3 py-1.5 font-medium">Operator / Owner</th>
              <th className="px-3 py-1.5 font-medium">Price</th>
              <th className="px-3 py-1.5 font-medium">Tour date</th>
              <th className="px-3 py-1.5 font-medium">Status</th>
              <th className="px-3 py-1.5 font-medium">Preference</th>
              <th className="px-3 py-1.5 font-medium">Remarks</th>
              <th className="w-16 px-3 py-1.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {proposedPremises.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                  No proposed premises yet. Use + Add Premises to select manually.
                </td>
              </tr>
            ) : (
              proposedPremises.map((row) => (
                <ProposedPremisesListRow
                  key={row.id}
                  row={row}
                  opportunityId={opportunity.id}
                  selected={selectedIds.has(row.id)}
                  onToggleSelect={() => toggleRow(row.id)}
                  onEdit={() => setSelectedLineId(row.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Edit price, tour date, status, preference, and remarks inline. Open the drawer for fees and full detail.
      </p>

      <PremisesSelectorModal
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        opportunityId={opportunity.id}
        excludeIds={existingPremisesIds}
      />

      <ProposedPremisesLinePanel
        line={selectedLine}
        opportunityId={opportunity.id}
        onClose={() => setSelectedLineId(null)}
      />
    </div>
  );
}
