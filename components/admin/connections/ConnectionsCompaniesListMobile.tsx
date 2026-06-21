"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ConnectionsCompaniesListState } from "@/components/admin/connections/useConnectionsCompaniesList";
import { confirmDeleteCompany } from "@/components/admin/mobile/mobileListDelete";
import {
  MobileSwipeDeleteGroup,
  MobileSwipeToDeleteRow,
} from "@/components/admin/mobile/MobileSwipeToDeleteRow";
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
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();
  const { rows, searchParams, displayedRows } = state;

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
            const href = companyDrawerHref("/admin/companies", searchParams, row.id, "overview");
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
              </MobileSwipeToDeleteRow>
            );
          })
        )}
      </div>
    </MobileSwipeDeleteGroup>
  );
}
