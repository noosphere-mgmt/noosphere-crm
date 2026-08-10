"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { addProposedPremisesAction, deleteProposedPremisesAction } from "@/app/admin/opportunities/workspaceActions";
import { createProposalFromShortlistAndRedirectAction } from "@/app/admin/opportunities/proposalActions";
import { IconTrash } from "@/components/admin/ModuleActionIcons";
import { moduleActionButtonClass } from "@/components/admin/ModuleActionBar";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { PremisesSelectorModal } from "@/components/admin/opportunities/PremisesSelectorModal";
import { ProposedPremisesLinePanel } from "@/components/admin/opportunities/ProposedPremisesLinePanel";
import { ProposedPremisesListRow } from "@/components/admin/opportunities/ProposedPremisesListRow";
import {
  formatProposedPremisesArea,
  formatProposedPremisesLabel,
  formatProposedPremisesProposedPrice,
  formatProposedPremisesTourDate,
  proposedPremisesListingRemarks,
  proposedPremisesPropertiesHref,
} from "@/lib/proposedPremisesDisplay";
import {
  normalizeProposedPremisesStatus,
  PROPOSED_PREMISES_PREFERENCE_LABELS,
  PROPOSED_PREMISES_STATUS_LABELS,
} from "@/lib/opportunityValues";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

export function OpportunityProposedPremisesTab({
  data,
  embedded = false,
  proposalsEnabled = false,
}: {
  data: OpportunityDetailData;
  embedded?: boolean;
  proposalsEnabled?: boolean;
}) {
  const theme = moduleAccentClasses("opportunities");
  const { opportunity, proposedPremises } = data;
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const selectedLine = useMemo(
    () => proposedPremises.find((r) => r.id === selectedLineId) ?? null,
    [proposedPremises, selectedLineId],
  );

  const existingPremisesIds = useMemo(
    () => new Set(proposedPremises.map((r) => r.premises_id)),
    [proposedPremises],
  );
  const selectedRows = useMemo(
    () => proposedPremises.filter((row) => selectedIds.has(row.id)),
    [proposedPremises, selectedIds],
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

  function handleCreateProposal() {
    const fd = new FormData();
    if (selectedIds.size > 0) fd.set("line_ids", [...selectedIds].join(","));
    startTransition(async () => {
      await createProposalFromShortlistAndRedirectAction(opportunity.id, fd);
    });
  }

  return (
    <div className={embedded ? "space-y-2" : "space-y-4"}>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setSelectorOpen(true)} className={theme.primaryButton}>
          + Add Premises
        </button>
        {proposalsEnabled ? (
          <button
            type="button"
            onClick={handleCreateProposal}
            disabled={pending || proposedPremises.length === 0}
            className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-900 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create proposal{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
          </button>
        ) : null}
        {selectedIds.size >= 2 ? (
          <button type="button" onClick={() => setCompareOpen((open) => !open)} className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-900 hover:bg-sky-100">
            Compare ({selectedIds.size}) {compareOpen ? "▴" : "▾"}
          </button>
        ) : null}
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

      {compareOpen && selectedRows.length >= 2 ? (
        <section className="overflow-hidden rounded-xl border border-sky-200 bg-white">
          <div className="border-b border-sky-100 bg-sky-50/60 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-sky-950">Side-by-side comparison</h3>
            <p className="mt-0.5 text-xs text-sky-800">Based on the selected premises and their current proposal records.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-left">
                  <th className="sticky left-0 z-10 min-w-28 bg-white px-3 py-2 text-xs font-medium text-slate-500">Compare</th>
                  {selectedRows.map((row) => <th key={row.id} className="min-w-52 px-3 py-2 font-semibold text-slate-900">{formatProposedPremisesLabel(row)}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Area / capacity", (row: (typeof selectedRows)[number]) => [formatProposedPremisesArea(row), row.workstation_count ? `${row.workstation_count} desks` : row.capacity_pax ? `${row.capacity_pax} pax` : null].filter(Boolean).join(" · ")],
                  ["Operator / owner", (row: (typeof selectedRows)[number]) => row.operator_name ?? row.owner_name ?? "—"],
                  ["Price", (row: (typeof selectedRows)[number]) => formatProposedPremisesProposedPrice(row)],
                  ["Status", (row: (typeof selectedRows)[number]) => PROPOSED_PREMISES_STATUS_LABELS[normalizeProposedPremisesStatus(row.status)]],
                  ["Preference", (row: (typeof selectedRows)[number]) => row.preference ? `${row.preference[0].toUpperCase()}${row.preference.slice(1)}` : "—"],
                  ["Tour date", (row: (typeof selectedRows)[number]) => formatProposedPremisesTourDate(row)],
                  ["Client comment", (row: (typeof selectedRows)[number]) => row.client_comment?.trim() || "—"],
                  ["Advisor note", (row: (typeof selectedRows)[number]) => row.advisor_comment?.trim() || row.remarks?.trim() || "—"],
                ].map(([label, read]) => (
                  <tr key={String(label)} className="border-t border-slate-100 align-top">
                    <th className="sticky left-0 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-600">{String(label)}</th>
                    {selectedRows.map((row) => <td key={row.id} className="px-3 py-2 text-slate-700">{(read as (value: (typeof selectedRows)[number]) => string)(row)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div className="space-y-3 md:hidden">
        {proposedPremises.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            No proposed premises yet. Use + Add Premises to select manually.
          </div>
        ) : (
          proposedPremises.map((row) => {
            const status = normalizeProposedPremisesStatus(row.status);
            const remarks = proposedPremisesListingRemarks(row);
            const capacity = row.workstation_count
              ? `${row.workstation_count} desks`
              : row.capacity_pax
                ? `${row.capacity_pax} pax`
                : "—";
            return (
              <article
                key={`mobile-${row.id}`}
                className={`rounded-xl border bg-white p-3 shadow-sm ${selectedIds.has(row.id) ? "border-emerald-300 ring-1 ring-emerald-100" : "border-slate-200"}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={() => toggleRow(row.id)}
                    aria-label={`Select ${formatProposedPremisesLabel(row)}`}
                    className="mt-1 rounded border-slate-300"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={proposedPremisesPropertiesHref(row.premises_id, opportunity.id)}
                      className={`block text-sm font-semibold leading-snug ${theme.link}`}
                    >
                      {formatProposedPremisesLabel(row)}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{row.operator_name ?? row.owner_name ?? "Operator / owner not recorded"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLineId(row.id)}
                    className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    Edit
                  </button>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-3">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Area</dt>
                    <dd className="mt-0.5 text-sm text-slate-800">{formatProposedPremisesArea(row)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Capacity</dt>
                    <dd className="mt-0.5 text-sm text-slate-800">{capacity}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Price</dt>
                    <dd className="mt-0.5 text-sm font-medium text-slate-900">{formatProposedPremisesProposedPrice(row)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tour date</dt>
                    <dd className="mt-0.5 text-sm text-slate-800">{formatProposedPremisesTourDate(row)}</dd>
                  </div>
                </dl>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">
                    {PROPOSED_PREMISES_STATUS_LABELS[status]}
                  </span>
                  {row.preference ? (
                    <span className="rounded-full bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-800">
                      {PROPOSED_PREMISES_PREFERENCE_LABELS[row.preference] ?? row.preference}
                    </span>
                  ) : null}
                </div>
                {remarks ? <p className="mt-3 border-t border-slate-100 pt-2 text-xs leading-relaxed text-slate-600">{remarks}</p> : null}
              </article>
            );
          })
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
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

      <p className={`text-xs text-slate-500 md:hidden ${embedded ? "hidden" : ""}`}>
        Select two or more premises to compare. Tap Edit to update price, tour date, status, preference, comments and fees.
      </p>
      <p className={`hidden text-xs text-slate-500 md:block ${embedded ? "md:hidden" : ""}`}>
        Select two or more premises to compare. Edit price, tour date, status, preference and remarks inline; open a row for client comments, advisor notes and fees.
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
