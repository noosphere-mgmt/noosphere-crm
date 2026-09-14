"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { duplicateOpportunityAction } from "@/app/admin/opportunities/actions";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { SortableTableHeader } from "@/components/admin/SortableTableHeader";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import type { OpportunitiesListState } from "@/components/admin/opportunities/useOpportunitiesList";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { companyFullPageHref, contactFullPageHref } from "@/lib/crmDetailNav";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { buildOpportunitiesReturnTo } from "@/lib/opportunitiesDrawerNav";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import { OPPORTUNITY_STATUS_COLORS, opportunityStatusChip } from "@/lib/opportunityStatusTheme";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { opportunityChineseDisplayName } from "@/lib/opportunitiesList";
import type { Opportunity } from "@/lib/types/entities";
import {
  formatOpportunityMoney,
  isRealisedWonRevenue,
  opportunityFinancials,
} from "@/lib/opportunityFinancials";

function formatDateLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 10);
}

export function OpportunitiesListDesktop({
  state,
  onOpenWorkspace,
}: {
  state: OpportunitiesListState;
  onOpenWorkspace: (row: Opportunity) => void;
}) {
  const {
    rows,
    selected,
    toggleOne,
    toggleAll,
    sortKey,
    sortDir,
    displayedRows,
    displayedIds,
    allDisplayedSelected,
    handleSort,
  } = state;
  const theme = moduleAccentClasses("opportunities");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isCloning, startClone] = useTransition();
  const listReturnTo = buildOpportunitiesReturnTo(searchParams);
  const colCount = 9;

  function onClone(row: Opportunity) {
    startClone(async () => {
      const result = await duplicateOpportunityAction(row.id);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      router.push(
        opportunityWorkspaceHref(
          { id: result.opportunity_id, business_id: result.business_id },
          "overview",
          undefined,
          listReturnTo,
        ),
      );
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="w-10 px-3 py-1.5 align-top">
              <input
                type="checkbox"
                aria-label="Select all"
                checked={allDisplayedSelected}
                onChange={(e) => toggleAll(displayedIds, e.target.checked)}
                className="rounded border-slate-300"
              />
            </th>
            <SortableTableHeader label="Opportunity" sortKey="opportunity" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTableHeader label="Company" sortKey="company" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTableHeader label="Contact" sortKey="contact" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTableHeader label="Expected Close" sortKey="expected_close" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTableHeader label="Status" sortKey="status" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <th className="px-3 py-1.5 align-top font-medium">Commission / Profit</th>
            <SortableTableHeader label="Updated" sortKey="updated" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <th className="w-24 px-3 py-1.5 align-top font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-4 py-8 text-center text-slate-500">
                No opportunities yet.
              </td>
            </tr>
          ) : displayedRows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-4 py-8 text-center text-slate-500">
                No opportunities match your search.
              </td>
            </tr>
          ) : (
            displayedRows.map((row) => {
              const clientZh = opportunityChineseDisplayName(row.client_name, row.linked_company_name_zh);
              const companyZh = opportunityChineseDisplayName(row.linked_company_name, row.linked_company_name_zh);
              return (
              <tr
                key={row.id}
                className="border-t border-slate-100"
                style={{ boxShadow: `inset 3px 0 0 ${OPPORTUNITY_STATUS_COLORS[row.status]}` }}
              >
                <td className="px-3 py-1.5">
                  <input
                    type="checkbox"
                    aria-label={`Select ${row.client_name}`}
                    checked={selected.has(String(row.id))}
                    onChange={() => toggleOne(String(row.id))}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="max-w-[14rem] px-3 py-1.5">
                  <AdminEntityLink
                    href={opportunityWorkspaceHref(row, "overview", undefined, listReturnTo)}
                    className={`block truncate text-left ${theme.link}`}
                  >
                    <span title={row.client_name}>
                      {row.client_name}
                      {row.district_preference ? ` – ${row.district_preference.split(/[,;/|]/)[0]?.trim()}` : ""}
                    </span>
                  </AdminEntityLink>
                  {clientZh ? (
                    <p className="mt-0.5 truncate text-xs text-slate-500">{clientZh}</p>
                  ) : null}
                  <RecordBusinessId id={row.business_id ?? row.v1_opportunity_id} className="mt-0.5 block" />
                </td>
                <td className="px-3 py-1.5 text-slate-700">
                  <AdminEntityLink
                    href={companyFullPageHref(row.linked_company_business_id ?? row.company_id)}
                    className={`${theme.link} underline-offset-2 hover:underline`}
                    fallback={row.linked_company_name ?? "No Company"}
                  >
                    {row.linked_company_name}
                  </AdminEntityLink>
                  {companyZh ? (
                    <p className="mt-0.5 truncate text-xs text-slate-500">{companyZh}</p>
                  ) : null}
                </td>
                <td className="px-3 py-1.5 text-slate-700">
                  <AdminEntityLink
                    href={contactFullPageHref(row.primary_contact_business_id ?? row.primary_contact_id)}
                    className={`${theme.link} underline-offset-2 hover:underline`}
                  >
                    {row.primary_contact_name}
                  </AdminEntityLink>
                </td>
                <td className="px-3 py-1.5 text-slate-700">
                  <p className="tabular-nums">{formatDateLabel(row.expected_close_date)}</p>
                </td>
                <td className="px-3 py-1.5">
                  <span {...opportunityStatusChip(row.status)}>{OPPORTUNITY_STATUS_LABELS[row.status]}</span>
                </td>
                <td className="px-3 py-1.5 text-slate-700">
                  {(() => {
                    const financials = opportunityFinancials(row);
                    return (
                      <>
                        <p className="tabular-nums">{formatOpportunityMoney(financials.commission_income)}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {isRealisedWonRevenue(row.status) ? "Won" : "Est."} ·{" "}
                          {formatOpportunityMoney(financials.net_profit)}
                        </p>
                      </>
                    );
                  })()}
                </td>
                <td className="px-3 py-1.5 text-slate-700">{formatDateLabel(row.updated_at)}</td>
                <td className="px-3 py-1.5">
                  <ModuleRowActions
                    module="opportunities"
                    onView={() => onOpenWorkspace(row)}
                    editHref={opportunityWorkspaceHref(row, "overview", "edit", listReturnTo)}
                    onDuplicate={isCloning ? undefined : () => onClone(row)}
                    duplicateLabel="Clone"
                  />
                </td>
              </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
