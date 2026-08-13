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
import { MobileCardMeta, MobileCardTitle } from "@/components/admin/mobile/MobileCard";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { MobileContactActions } from "@/components/admin/mobile/MobileContactActions";
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
      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
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
                className="border-b border-slate-100 last:border-b-0"
              >
                <div className="px-3 py-3">
                  <AdminEntityLink href={href} className={`block font-semibold ${connectionsGlassClasses.link}`}>
                    <MobileCardTitle>{row.company_name}</MobileCardTitle>
                    {row.company_name_zh ? (
                      <span className="mt-0.5 block text-xs font-normal text-slate-500">{row.company_name_zh}</span>
                    ) : null}
                    <RecordBusinessId id={row.business_id ?? row.v1_company_id} className="mt-0.5 block" />
                  </AdminEntityLink>
                  <MobileCardMeta>
                    {formatCompanyRoles(row.roles)} · {row.open_opportunities ?? 0} open opps
                  </MobileCardMeta>
                  <MobileCardMeta>
                    <AdminEntityLink
                      href={contactHref}
                      className={`${connectionsGlassClasses.link} underline-offset-2 hover:underline`}
                      fallback="No primary contact"
                    >
                      {row.primary_contact_name}
                    </AdminEntityLink>
                    {row.coverage?.length ? ` · ${formatCoverage(row.coverage)}` : ""}
                  </MobileCardMeta>
                  <MobileContactActions
                    phone={row.primary_contact_phone}
                    email={row.primary_contact_email}
                  />
                </div>
              </MobileSwipeToDeleteRow>
            );
          })
        )}
      </div>
    </MobileSwipeDeleteGroup>
  );
}
