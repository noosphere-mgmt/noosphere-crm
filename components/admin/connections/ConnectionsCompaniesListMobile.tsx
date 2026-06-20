"use client";

import Link from "next/link";
import type { ConnectionsCompaniesListState } from "@/components/admin/connections/useConnectionsCompaniesList";
import { formatCompanyRoles, formatCoverage } from "@/lib/connectionsDisplay";
import { companyDrawerHref } from "@/lib/connectionsDrawerNav";
import { MobileCard, MobileCardList, MobileCardMeta, MobileCardTitle } from "@/components/admin/mobile/MobileCard";
import { MobileContactActions } from "@/components/admin/mobile/MobileContactActions";

export function ConnectionsCompaniesListMobile({
  state,
}: {
  state: ConnectionsCompaniesListState;
}) {
  const { rows, searchParams, displayedRows } = state;

  return (
    <MobileCardList>
      {displayedRows.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-slate-500">
          {rows.length === 0 ? "No companies yet." : "No companies match your search."}
        </p>
      ) : (
        displayedRows.map((row) => (
          <Link
            key={row.id}
            href={companyDrawerHref("/admin/companies", searchParams, row.id, "overview")}
            className="block"
          >
            <MobileCard>
              <MobileCardTitle>{row.company_name}</MobileCardTitle>
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
            </MobileCard>
          </Link>
        ))
      )}
    </MobileCardList>
  );
}
