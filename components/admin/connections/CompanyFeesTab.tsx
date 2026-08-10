"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/formatCurrency";
import { opportunityDetailHref } from "@/lib/opportunityDetailNav";
import { partyRoleLabel } from "@/lib/opportunityPartiesDisplay";
import type { CompanyFeeDealRow } from "@/lib/repos/connectionOpportunities";

const CONFIRMED_COLLECT_STATUSES = new Set(["confirmed", "invoiced", "paid"]);

function parseAmount(value: string | null | undefined): number {
  if (value == null || String(value).trim() === "") return 0;
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

export function CompanyFeesTab({ rows }: { rows: CompanyFeeDealRow[] }) {
  let expectedCollect = 0;
  let confirmedCollect = 0;
  let paidOut = 0;

  for (const row of rows) {
    const collect = parseAmount(row.collect_fee_amount);
    const paid = parseAmount(row.paid_out_fee_amount);
    const status = row.collect_fee_status ?? "expected";
    if (status === "expected") expectedCollect += collect;
    if (CONFIRMED_COLLECT_STATUSES.has(status)) confirmedCollect += collect;
    paidOut += paid;
  }

  const netFee = confirmedCollect - paidOut;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Fee lines from deal party records where this company is a party. Edit fees on each deal workspace.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Expected collect", value: expectedCollect },
          { label: "Confirmed collect", value: confirmedCollect },
          { label: "Paid out", value: paidOut },
          { label: "Net fee", value: netFee },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatMoney(card.value)}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Deal</th>
              <th className="px-3 py-2 font-medium">Party role</th>
              <th className="px-3 py-2 font-medium">Collect</th>
              <th className="px-3 py-2 font-medium">Paid out</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No fee records linked to this company yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.party_id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    <Link
                      href={opportunityDetailHref(
                        row.opportunity_id,
                        "overview",
                        undefined,
                        row.opportunity_business_id,
                      )}
                      className="text-violet-900 hover:underline"
                    >
                      {row.opportunity_client_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{partyRoleLabel(row.role)}</td>
                  <td className="px-3 py-2 text-slate-700">{formatMoney(row.collect_fee_amount)}</td>
                  <td className="px-3 py-2 text-slate-700">{formatMoney(row.paid_out_fee_amount)}</td>
                  <td className="px-3 py-2 text-slate-700">{row.collect_fee_status ?? "—"}</td>
                  <td className="max-w-[12rem] px-3 py-2 whitespace-pre-wrap text-slate-700">
                    {row.fee_note?.trim() || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
