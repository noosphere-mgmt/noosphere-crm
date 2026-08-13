"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addProposedPremisesAction } from "@/app/admin/opportunities/workspaceActions";
import { opportunityDetailHref } from "@/lib/opportunityDetailNav";
import { isProfServiceSalesRole } from "@/lib/opportunityValues";
import type { Opportunity } from "@/lib/types/entities";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

export function PremisesAddToShortlistModal({
  open,
  onClose,
  premises,
  opportunities,
  linkedOpportunityIds,
}: {
  open: boolean;
  onClose: () => void;
  premises: PremisesV1;
  opportunities: Opportunity[];
  linkedOpportunityIds: Set<number>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const eligible = useMemo(() => {
    return opportunities.filter((o) => {
      if (linkedOpportunityIds.has(o.id)) return false;
      if (isProfServiceSalesRole(o.sales_role)) return false;
      if (o.status === "closed_lost" || o.status === "closed_won") return false;
      return true;
    });
  }, [opportunities, linkedOpportunityIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return eligible.slice(0, 30);
    return eligible
      .filter((o) => {
        const hay = [
          o.client_name,
          o.linked_company_name,
          o.company_name,
          o.district_preference,
          o.business_id,
          String(o.id),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 30);
  }, [eligible, query]);

  if (!open) return null;

  function addToDeal(opportunityId: number) {
    const fd = new FormData();
    fd.set("premises_ids", premises.premises_id);
    startTransition(async () => {
      await addProposedPremisesAction(opportunityId, fd);
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-900">Add to deal shortlist</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Select an active deal to propose {premises.business_id ?? premises.premises_id}.
          </p>
        </div>
        <div className="px-4 py-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by client, company, or district…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            autoFocus
          />
          <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                No matching deals available.
              </li>
            ) : (
              filtered.map((o) => {
                const href = opportunityDetailHref(o.id, "proposed", undefined, o.business_id);
                return (
                  <li key={o.id}>
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{o.client_name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {[o.linked_company_name, o.district_preference?.split(/[,;/|]/)[0], o.business_id]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {href ? (
                          <Link href={href} className="text-xs text-violet-800 hover:underline">
                            View
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => addToDeal(o.id)}
                          className="rounded-md bg-blue-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
        <div className="flex justify-end border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
