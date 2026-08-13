"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OpportunitiesListState } from "@/components/admin/opportunities/useOpportunitiesList";
import { confirmDeleteOpportunity } from "@/components/admin/mobile/mobileListDelete";
import {
  MobileSwipeDeleteGroup,
  MobileSwipeToDeleteRow,
} from "@/components/admin/mobile/MobileSwipeToDeleteRow";
import { companyFullPageHref, contactFullPageHref } from "@/lib/crmDetailNav";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { formatOpportunityExpectedFee } from "@/lib/opportunitiesList";
import { opportunityStatusChip } from "@/lib/opportunityStatusTheme";
import { MobileCardMeta, MobileCardTitle } from "@/components/admin/mobile/MobileCard";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";

function formatDateLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 10);
}

export function OpportunitiesListMobile({
  state,
  onOpenWorkspace,
}: {
  state: OpportunitiesListState;
  onOpenWorkspace: (row: import("@/lib/types/entities").Opportunity) => void;
}) {
  const router = useRouter();
  const theme = moduleAccentClasses("opportunities");
  const [isDeleting, startDelete] = useTransition();
  const { rows, displayedRows } = state;

  function deleteOpportunityRow(id: number, label: string) {
    startDelete(async () => {
      const deleted = await confirmDeleteOpportunity(label, id);
      if (deleted) router.refresh();
    });
  }

  return (
    <MobileSwipeDeleteGroup>
      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {displayedRows.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            {rows.length === 0 ? "No opportunities yet." : "No opportunities match your search."}
          </p>
        ) : (
          displayedRows.map((row) => {
            const id = String(row.id);
            const companyHref = companyFullPageHref(
              row.linked_company_business_id ?? row.company_id,
            );
            const contactHref = contactFullPageHref(
              row.primary_contact_business_id ?? row.primary_contact_id,
            );
            return (
              <MobileSwipeToDeleteRow
                key={row.id}
                rowId={id}
                disabled={isDeleting}
                deleteLabel={`Delete ${row.client_name}`}
                onDelete={() => deleteOpportunityRow(row.id, row.client_name)}
                className="border-b border-slate-100 last:border-b-0"
              >
                <div className="w-full px-3 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => onOpenWorkspace(row)}
                    className="w-full cursor-pointer text-left active:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <MobileCardTitle>{row.client_name}</MobileCardTitle>
                      <RecordBusinessId id={row.business_id ?? row.v1_opportunity_id} className="mt-0.5 block" />
                      <span {...opportunityStatusChip(row.status)} className="shrink-0 text-xs">
                        {OPPORTUNITY_STATUS_LABELS[row.status]}
                      </span>
                    </div>
                  </button>
                  <MobileCardMeta>
                    <AdminEntityLink
                      href={companyHref}
                      className={`${theme.link} underline-offset-2 hover:underline`}
                      fallback={row.linked_company_name ?? "No company"}
                    >
                      {row.linked_company_name}
                    </AdminEntityLink>
                    {row.primary_contact_name ? (
                      <>
                        {" · "}
                        <AdminEntityLink
                          href={contactHref}
                          className={`${theme.link} underline-offset-2 hover:underline`}
                        >
                          {row.primary_contact_name}
                        </AdminEntityLink>
                      </>
                    ) : null}
                    {row.district_preference ? ` · ${row.district_preference.split(/[,;/|]/)[0]?.trim()}` : ""}
                  </MobileCardMeta>
                  <button
                    type="button"
                    onClick={() => onOpenWorkspace(row)}
                    className="w-full cursor-pointer text-left active:bg-slate-50"
                  >
                    <MobileCardMeta>
                      Expected fees {formatOpportunityExpectedFee(row.expected_fee)} · Updated{" "}
                      {formatDateLabel(row.updated_at)}
                    </MobileCardMeta>
                  </button>
                </div>
              </MobileSwipeToDeleteRow>
            );
          })
        )}
      </div>
    </MobileSwipeDeleteGroup>
  );
}
