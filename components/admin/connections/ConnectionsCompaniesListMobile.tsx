"use client";

import Link from "next/link";
import type { ConnectionsCompaniesListState } from "@/components/admin/connections/useConnectionsCompaniesList";
import { formatCompanyRoles, formatCoverage } from "@/lib/connectionsDisplay";
import { companyDrawerHref } from "@/lib/connectionsDrawerNav";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import { MobileCardMeta, MobileCardTitle } from "@/components/admin/mobile/MobileCard";
import { MobileContactActions } from "@/components/admin/mobile/MobileContactActions";

export function ConnectionsCompaniesListMobile({
  state,
}: {
  state: ConnectionsCompaniesListState;
}) {
  const { rows, searchParams, displayedRows, selected, toggleOne, toggleAll, allDisplayedSelected, displayedIds } =
    state;

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {displayedRows.length > 0 ? (
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
          <input
            type="checkbox"
            checked={allDisplayedSelected}
            onChange={(e) => toggleAll(displayedIds, e.target.checked)}
            aria-label="Select all companies"
            className="rounded border-slate-300"
          />
          <span className="text-xs text-slate-500">Select all</span>
        </div>
      ) : null}

      {displayedRows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-500">
          {rows.length === 0 ? "No companies yet." : "No companies match your search."}
        </p>
      ) : (
        displayedRows.map((row) => {
          const id = String(row.id);
          const href = companyDrawerHref("/admin/companies", searchParams, row.id, "overview");
          return (
            <div
              key={row.id}
              className="flex items-start gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0"
            >
              <input
                type="checkbox"
                checked={selected.has(id)}
                onChange={() => toggleOne(id)}
                aria-label={`Select ${row.company_name}`}
                className="mt-1 rounded border-slate-300"
              />
              <div className="min-w-0 flex-1">
                <Link href={href} className={`block font-semibold ${connectionsGlassClasses.link}`}>
                  <MobileCardTitle>{row.company_name}</MobileCardTitle>
                </Link>
                <MobileCardMeta>
                  {formatCompanyRoles(row.roles)} · {row.open_opportunities ?? 0} open opps
                </MobileCardMeta>
                <MobileCardMeta>
                  {row.primary_contact_name ?? "No primary contact"}
                  {row.coverage?.length ? ` · ${formatCoverage(row.coverage)}` : ""}
                </MobileCardMeta>
                <MobileContactActions
                  phone={row.primary_contact_phone}
                  email={row.primary_contact_email}
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
