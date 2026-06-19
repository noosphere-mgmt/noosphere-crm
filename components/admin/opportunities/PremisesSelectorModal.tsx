"use client";

import { useEffect, useState, useTransition } from "react";
import {
  addProposedPremisesAction,
  searchPremisesForSelectorAction,
} from "@/app/admin/opportunities/workspaceActions";
import { formatMoney } from "@/lib/formatCurrency";

type PremisesRow = Awaited<ReturnType<typeof searchPremisesForSelectorAction>>[number];

export function PremisesSelectorModal({
  open,
  onClose,
  opportunityId,
  excludeIds,
}: {
  open: boolean;
  onClose: () => void;
  opportunityId: number;
  excludeIds: Set<string>;
}) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<PremisesRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setQ("");
      setRows([]);
      setSelected(new Set());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      const fd = new FormData();
      fd.set("q", q);
      startTransition(async () => {
        const results = await searchPremisesForSelectorAction(fd);
        setRows(results.filter((r) => !excludeIds.has(r.premises_id)));
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, q, excludeIds]);

  if (!open) return null;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAdd() {
    if (selected.size === 0) return;
    const fd = new FormData();
    fd.set("premises_ids", [...selected].join(","));
    startTransition(async () => {
      await addProposedPremisesAction(opportunityId, fd);
      onClose();
    });
  }

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-slate-900/20" aria-label="Close" onClick={onClose} />
      <div className="fixed inset-x-4 top-[10vh] z-50 mx-auto flex max-h-[80vh] w-full max-w-3xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-base font-semibold text-slate-900">Add premises</h3>
          <p className="mt-1 text-sm text-slate-600">Search by building, unit, or operator. Multi-select then add.</p>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search premises…"
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="w-10 px-3 py-2" />
                <th className="px-3 py-2 font-medium">Building</th>
                <th className="px-3 py-2 font-medium">Space</th>
                <th className="px-3 py-2 font-medium">Operator</th>
                <th className="px-3 py-2 font-medium">Area</th>
                <th className="px-3 py-2 font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    {pending ? "Searching…" : q ? "No premises found." : "Type to search premises."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.premises_id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(row.premises_id)}
                        onChange={() => toggle(row.premises_id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-3 py-2 text-slate-900">{row.building_name}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {[row.floor, row.unit].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{row.operator_name ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {row.gross_area_sqft ? `${row.gross_area_sqft} sq ft` : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {row.monthly_rent
                        ? `${formatMoney(row.monthly_rent, row.currency)}/mo`
                        : row.asking_sale_price
                          ? formatMoney(row.asking_sale_price, row.currency)
                          : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={pending || selected.size === 0}
            className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            Add selected ({selected.size})
          </button>
        </div>
      </div>
    </>
  );
}
