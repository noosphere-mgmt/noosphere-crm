"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  addProposedPremisesAction,
  getOpportunityMatchesAction,
} from "@/app/admin/opportunities/workspaceActions";
import { formatMoney } from "@/lib/formatCurrency";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

type MatchRow = Awaited<ReturnType<typeof getOpportunityMatchesAction>>[number];

function MatchScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 70 ? "bg-emerald-100 text-emerald-900" : score >= 50 ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex min-w-[2.5rem] justify-center rounded-full px-2 py-0.5 text-sm font-semibold tabular-nums ${tone}`}>
      {score}
    </span>
  );
}

function MatchDetailPanel({
  row,
  onClose,
  onAdd,
  adding,
}: {
  row: MatchRow;
  onClose: () => void;
  onAdd: () => void;
  adding: boolean;
}) {
  const theme = moduleAccentClasses("opportunities");
  const href = row.premises_business_id
    ? `/admin/properties/premises/${row.premises_business_id}`
    : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Premise detail</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {href ? (
              <Link href={href} className="text-emerald-800 hover:underline">
                {row.premises_business_id ?? row.premises_id}
              </Link>
            ) : (
              (row.premises_business_id ?? row.premises_id)
            )}
          </p>
          <p className="text-sm text-slate-600">{row.display_label}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          aria-label="Close premise detail"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Building</p>
          <p className="mt-1 font-medium text-slate-900">{row.building_name ?? "—"}</p>
          {row.building_district ? <p className="text-slate-600">{row.building_district}</p> : null}
        </div>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-slate-500">Category</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{row.property_category || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Space form</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{row.space_form || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Area</dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {row.area_sqft ? `${row.area_sqft} sq ft` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Capacity</dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {row.capacity_pax != null ? `${row.capacity_pax} pax` : "—"}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-slate-500">Price</dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {row.asking_rent
                ? `${formatMoney(row.asking_rent)}/mo`
                : row.asking_sale_price
                  ? formatMoney(row.asking_sale_price)
                  : "—"}
            </dd>
          </div>
        </dl>
        {row.match_reasons.length > 0 ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Match reasons</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
              {row.match_reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {row.match_gaps.length > 0 ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Gaps</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-amber-800">
              {row.match_gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="border-t border-slate-100 px-5 py-4">
        <button
          type="button"
          disabled={adding}
          onClick={onAdd}
          className={`${theme.primaryButton} w-full disabled:opacity-50`}
        >
          {adding ? "Adding to shortlist…" : "Add to shortlist"}
        </button>
      </div>
    </div>
  );
}

export function OpportunityMatchBoard({
  opportunityId,
  excludeIds,
}: {
  opportunityId: number;
  excludeIds: Set<string>;
}) {
  const theme = moduleAccentClasses("opportunities");
  const excludeKey = useMemo(() => [...excludeIds].sort().join(","), [excludeIds]);
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    startTransition(async () => {
      try {
        const matches = await getOpportunityMatchesAction(opportunityId);
        if (!cancelled) {
          const filtered = matches.filter((m) => m.premises_id && !excludeIds.has(m.premises_id));
          setRows(filtered);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load matches");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [opportunityId, excludeKey]);

  const selected = useMemo(
    () => rows.find((r) => r.premises_id === selectedId) ?? null,
    [rows, selectedId],
  );

  function handleAdd(premisesId: string) {
    setAddingId(premisesId);
    const fd = new FormData();
    fd.set("premises_ids", premisesId);
    startTransition(async () => {
      await addProposedPremisesAction(opportunityId, fd);
      setRows((prev) => {
        const next = prev.filter((r) => r.premises_id !== premisesId);
        if (selectedId === premisesId) {
          setSelectedId(null);
        }
        return next;
      });
      setAddingId(null);
    });
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100/80">
        Loading ranked matches…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 px-6 py-12 text-center text-sm text-red-700 ring-1 ring-red-100">
        {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-50 px-6 py-16 text-center shadow-sm ring-1 ring-slate-100/80">
        <h3 className="text-lg font-semibold text-slate-900">No matches yet</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
          Adjust property category, space form, district, or budget on the Brief tab — or add supply in
          Properties.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100/80">
        <div className="px-6 py-5">
          <h3 className="text-base font-semibold text-slate-900">Ranked matches</h3>
          <p className="mt-1 text-sm text-slate-500">
            {rows.length} premises · click a row for detail
          </p>
        </div>
        <div className="space-y-2 border-t border-slate-100 p-3 md:hidden">
          {rows.map((row) => {
            const pid = row.premises_id!;
            return (
              <article key={`mobile-${pid}`} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-slate-900">{row.building_name ?? row.display_label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{[row.building_district, row.display_label].filter(Boolean).join(" · ")}</p>
                  </div>
                  <MatchScoreBadge score={row.match_score} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <span>{row.area_sqft ? `${row.area_sqft} sq ft` : "Area —"}</span>
                  <span className="text-right">{row.asking_rent ? `${formatMoney(row.asking_rent)}/mo` : row.asking_sale_price ? formatMoney(row.asking_sale_price) : "Price —"}</span>
                </div>
                <button type="button" disabled={pending && addingId === pid} onClick={() => handleAdd(pid)} className={`${theme.primaryButton} mt-3 w-full text-sm disabled:opacity-50`}>
                  {pending && addingId === pid ? "Adding…" : "Add premises"}
                </button>
              </article>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto border-t border-slate-100 md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Building</th>
                <th className="px-5 py-3 font-medium">Premises</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Price</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Top reason</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const pid = row.premises_id!;
                const isSelected = selectedId === pid;
                const href = row.premises_business_id
                  ? `/admin/properties/premises/${row.premises_business_id}`
                  : null;
                return (
                  <tr
                    key={pid}
                    className={`cursor-pointer border-t border-slate-50 align-top transition ${
                      isSelected ? "bg-emerald-50/50" : "hover:bg-slate-50/80"
                    }`}
                    onClick={() => setSelectedId(isSelected ? null : pid)}
                  >
                    <td className="px-5 py-4">
                      <MatchScoreBadge score={row.match_score} />
                    </td>
                    <td className="px-5 py-4 text-slate-900">
                      <div className="font-medium">{row.building_name ?? "—"}</div>
                      {row.building_district ? (
                        <div className="text-xs text-slate-500">{row.building_district}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      {href ? (
                        <Link
                          href={href}
                          className="font-medium text-emerald-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.premises_business_id ?? pid}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-900">{row.premises_business_id ?? pid}</span>
                      )}
                      <div className="text-xs text-slate-600">{row.display_label}</div>
                    </td>
                    <td className="hidden px-5 py-4 text-slate-700 md:table-cell">
                      {row.asking_rent
                        ? `${formatMoney(row.asking_rent)}/mo`
                        : row.asking_sale_price
                          ? formatMoney(row.asking_sale_price)
                          : "—"}
                    </td>
                    <td className="hidden max-w-[14rem] px-5 py-4 text-xs text-slate-600 lg:table-cell">
                      {row.match_reasons[0] ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={pending && addingId === pid}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdd(pid);
                        }}
                        className={`${theme.primaryButton} whitespace-nowrap text-xs disabled:opacity-50`}
                      >
                        {pending && addingId === pid ? "Adding…" : "Shortlist"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/20"
            aria-label="Close premise detail"
            onClick={() => setSelectedId(null)}
          />
          <aside className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] top-0 z-50 flex w-full flex-col bg-white shadow-2xl ring-1 ring-slate-200 md:inset-y-0 md:left-auto md:max-w-md">
            <MatchDetailPanel
              row={selected}
              onClose={() => setSelectedId(null)}
              onAdd={() => handleAdd(selected.premises_id!)}
              adding={pending && addingId === selected.premises_id}
            />
          </aside>
        </>
      ) : null}
    </>
  );
}
