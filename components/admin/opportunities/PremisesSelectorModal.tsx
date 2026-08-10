"use client";

import { useEffect, useState, useTransition } from "react";
import {
  addProposedPremisesAction,
  getOpportunityMatchesAction,
  searchPremisesForSelectorAction,
} from "@/app/admin/opportunities/workspaceActions";
import { formatMoney } from "@/lib/formatCurrency";
import { formatPremisesName } from "@/lib/premisesDisplay";

type PremisesRow = Awaited<ReturnType<typeof searchPremisesForSelectorAction>>[number];
type MatchRow = Awaited<ReturnType<typeof getOpportunityMatchesAction>>[number];

type SourceTab = "search" | "matches";

export function PremisesSelectorModal({
  open,
  onClose,
  opportunityId,
  excludeIds,
  initialTab = "search",
}: {
  open: boolean;
  onClose: () => void;
  opportunityId: number;
  excludeIds: Set<string>;
  initialTab?: SourceTab;
}) {
  const [tab, setTab] = useState<SourceTab>(initialTab);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<PremisesRow[]>([]);
  const [matchRows, setMatchRows] = useState<MatchRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setTab(initialTab);
    } else {
      setQ("");
      setRows([]);
      setMatchRows([]);
      setSelected(new Set());
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open || tab !== "search") return;
    const timer = window.setTimeout(() => {
      const fd = new FormData();
      fd.set("q", q);
      startTransition(async () => {
        const results = await searchPremisesForSelectorAction(fd);
        setRows(results.filter((r) => !excludeIds.has(r.premises_id)));
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, tab, q, excludeIds]);

  useEffect(() => {
    if (!open || tab !== "matches") return;
    startTransition(async () => {
      const results = await getOpportunityMatchesAction(opportunityId);
      setMatchRows(
        results.filter((r) => r.premises_id && !excludeIds.has(r.premises_id)),
      );
    });
  }, [open, tab, opportunityId, excludeIds]);

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

  function addSingle(premisesId: string) {
    const fd = new FormData();
    fd.set("premises_ids", premisesId);
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
          <h3 className="text-base font-semibold text-slate-900">
            {tab === "search" ? "Search All Premises" : "Suggested Matching Premises"}
          </h3>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setTab("search")}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                tab === "search" ? "bg-emerald-100 font-medium text-emerald-900" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Search All
            </button>
            <button
              type="button"
              onClick={() => setTab("matches")}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                tab === "matches" ? "bg-emerald-100 font-medium text-emerald-900" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Suggested Matches
            </button>
          </div>
          {tab === "search" ? (
            <>
              <p className="mt-2 text-sm text-slate-600">Search the complete premises database by building, unit or operator.</p>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search premises…"
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                autoFocus
              />
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              Properties ranked against this opportunity’s category, location, area, capacity and budget requirements.
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {tab === "search" ? (
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="w-10 px-3 py-2" />
                  <th className="px-3 py-2 font-medium">Premise Name (English)</th>
                  <th className="px-3 py-2 font-medium">Operator</th>
                  <th className="px-3 py-2 font-medium">Area</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
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
                      <td className="px-3 py-2 text-slate-900">{formatPremisesName(row.building_name, row.floor, row.unit)}</td>
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
          ) : (
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="w-10 px-3 py-2" />
                  <th className="px-3 py-2 font-medium">Score</th>
                  <th className="px-3 py-2 font-medium">Building</th>
                  <th className="px-3 py-2 font-medium">Space</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                  <th className="w-20 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {matchRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      {pending ? "Loading matches…" : "No matches for current requirements."}
                    </td>
                  </tr>
                ) : (
                  matchRows.map((row) => {
                    const pid = row.premises_id!;
                    return (
                      <tr key={pid} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected.has(pid)}
                            onChange={() => toggle(pid)}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="px-3 py-2 font-semibold text-emerald-800">{row.match_score}</td>
                        <td className="px-3 py-2 text-slate-900">{row.building_name ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-700">{row.display_label}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {[row.property_category, row.space_form].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {row.asking_rent
                            ? `${formatMoney(row.asking_rent)}/mo`
                            : row.asking_sale_price
                              ? formatMoney(row.asking_sale_price)
                              : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => addSingle(pid)}
                            disabled={pending}
                            className="text-xs font-medium text-emerald-800 hover:underline disabled:opacity-50"
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
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
