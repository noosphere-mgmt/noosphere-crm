"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ConnectionsCompaniesListState } from "@/components/admin/connections/useConnectionsCompaniesList";
import { confirmDeleteCompany } from "@/components/admin/mobile/mobileListDelete";
import {
  MobileSwipeDeleteGroup,
  MobileSwipeToDeleteRow,
} from "@/components/admin/mobile/MobileSwipeToDeleteRow";
import { formatCompanyRoles, formatCoverage } from "@/lib/connectionsDisplay";
import { companyFullPageHref } from "@/lib/crmDetailNav";
import { contactDrawerHref } from "@/lib/connectionsDrawerNav";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";

export function ConnectionsCompaniesListMobile({
  state,
}: {
  state: ConnectionsCompaniesListState;
}) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();
  const { rows, displayedRows, searchParams } = state;

  function deleteCompanyRow(id: number) {
    startDelete(async () => {
      const deleted = await confirmDeleteCompany(id);
      if (deleted) router.refresh();
    });
  }

  return (
    <MobileSwipeDeleteGroup>
      <div className="space-y-2">
        {displayedRows.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            {rows.length === 0 ? "No companies yet." : "No companies match your search."}
          </p>
        ) : (
          displayedRows.map((row) => {
            const id = String(row.id);
            const href = companyFullPageHref(row.business_id ?? row.v1_company_id ?? row.id);
            const contactHref =
              row.primary_contact_business_id || row.primary_contact_id
                ? contactDrawerHref(
                    "/admin/contacts",
                    searchParams,
                    row.primary_contact_business_id ?? row.primary_contact_id!,
                  )
                : null;
            return (
              <MobileSwipeToDeleteRow
                key={row.id}
                rowId={id}
                disabled={isDeleting}
                deleteLabel={`Delete ${row.company_name}`}
                onDelete={() => deleteCompanyRow(row.id)}
                className="rounded-xl border border-l-4 border-[#E3DCD4] border-l-[#B29A82] bg-white shadow-[0_4px_14px_rgba(126,104,83,0.10)]"
              >
                <div className="bg-white px-3 py-3">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <AdminEntityLink href={href} className="min-w-0 flex-1">
                      <p className="break-words font-semibold text-[#6F5947]">{row.company_name}</p>
                      {row.company_name_zh ? (
                        <span className="mt-0.5 block text-xs font-medium text-[#806B59]">{row.company_name_zh}</span>
                      ) : null}
                    </AdminEntityLink>
                    <span className="shrink-0 rounded-full bg-[#ECE3D9] px-2 py-1 text-[11px] font-semibold text-[#6F5947]">
                      {row.open_opportunities ?? 0} open
                    </span>
                  </div>
                  <div className="mt-2 flex min-w-0 items-end justify-between gap-3 text-xs text-slate-600">
                    <div className="min-w-0">
                      <AdminEntityLink
                        href={contactHref}
                        className={`${connectionsGlassClasses.link} block truncate underline-offset-2 hover:underline`}
                        fallback="No primary contact"
                      >
                        {row.primary_contact_name}
                      </AdminEntityLink>
                      {row.coverage?.length ? <p className="mt-0.5 truncate text-slate-500">{formatCoverage(row.coverage)}</p> : null}
                    </div>
                    <span className="shrink-0 text-right text-slate-500">{formatCompanyRoles(row.roles)}</span>
                  </div>
                </div>
              </MobileSwipeToDeleteRow>
            );
          })
        )}
      </div>
    </MobileSwipeDeleteGroup>
  );
}
