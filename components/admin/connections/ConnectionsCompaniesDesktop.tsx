"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ConnectionsRelationshipTypeFilters } from "@/components/admin/connections/ConnectionsRelationshipTypeFilters";
import { ConnectionsSearchToolbarDesktop } from "@/components/admin/connections/ConnectionsSearchToolbarDesktop";
import { ConnectionsCompaniesListHeaderDesktop } from "@/components/admin/connections/ConnectionsCompaniesListHeaderDesktop";
import type { ConnectionsCompaniesListState } from "@/components/admin/connections/useConnectionsCompaniesList";
import { companyDrawerHref } from "@/lib/connectionsDrawerNav";
import { formatCompanyRoles, formatCoverage } from "@/lib/connectionsDisplay";
import type { Contact } from "@/lib/types/entities";

export function ConnectionsCompaniesDesktop({ state, contacts }: { state: ConnectionsCompaniesListState; contacts: Contact[] }) {
  const [companyId, setCompanyId] = useState<number | null>(null);
  const selectedCompany = state.displayedRows.find((row) => row.id === companyId) ?? null;
  const visibleContacts = useMemo(
    () => companyId == null ? contacts : contacts.filter((contact) => contact.company_id === companyId),
    [companyId, contacts],
  );
  return (
    <>
      <ConnectionsCompaniesListHeaderDesktop
        exportSelectedIds={state.exportSelectedIds}
        filteredIds={state.displayedIds}
        showCreate={false}
      />
      <ConnectionsSearchToolbarDesktop
        variant="companies"
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        quickFilters={state.quickFilters}
        onQuickFiltersChange={state.setQuickFilters}
        countries={state.countries}
        cities={state.cities}
        relationshipTypeSlot={<ConnectionsRelationshipTypeFilters />}
      />
      <div className="grid min-h-[65vh] grid-cols-[20rem_minmax(0,1fr)] gap-4">
        <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2">
                <input
                  type="checkbox"
                  aria-label="Select all companies"
                  checked={state.allDisplayedSelected}
                  onChange={(e) => state.toggleAll(state.selectionIds, e.target.checked)}
                  className="mt-1 rounded border-slate-300"
                />
                <div>
                  <h2 className="font-semibold text-slate-900">Companies</h2>
                  <p className="text-xs text-slate-500">
                    {state.displayedRows.length} of {state.rows.length}
                    {state.selectedCount > 0 ? ` · ${state.selectedCount} selected` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {companyId != null ? (
                  <button type="button" onClick={() => setCompanyId(null)} className="text-xs font-semibold text-emerald-700 hover:text-emerald-900">
                    Show all
                  </button>
                ) : null}
                <Link href="/admin/companies/new" className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800">
                  + Company
                </Link>
              </div>
            </div>
          </div>
          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto p-2">
            {state.displayedRows.map((company) => {
              const rowId = String(company.id);
              return (
              <div
                key={company.id}
                className={`group mb-1 flex items-start gap-1 rounded-lg pr-1 ${companyId === company.id ? "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-100" : "text-slate-700 hover:bg-slate-50"}`}
              >
                <label className="mt-3 flex shrink-0 items-center pl-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={state.selected.has(rowId)}
                    onChange={() => state.toggleOne(rowId)}
                    aria-label={`Select ${company.company_name}`}
                    className="rounded border-slate-300"
                  />
                </label>
                <button type="button" onClick={() => setCompanyId(company.id)} className="min-w-0 flex-1 px-2 py-2.5 text-left">
                  <span className={`block truncate text-sm ${companyId === company.id ? "font-semibold" : "font-medium"}`}>{company.company_name}</span>
                  <span className="mt-1 block truncate text-xs text-slate-500">{formatCompanyRoles(company.roles) || "No role"}</span>
                  <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {company.open_opportunities ?? 0} open opportunities
                  </span>
                </button>
                <Link
                  href={companyDrawerHref("/admin/companies", state.searchParams, company.id, "overview")}
                  aria-label={`Open ${company.company_name}`}
                  title="Open company details"
                  className="mt-2 rounded-md px-2 py-1 text-emerald-700 opacity-70 hover:bg-white hover:opacity-100"
                >
                  ↗
                </Link>
              </div>
              );
            })}
            {state.displayedRows.length === 0 ? <p className="px-3 py-8 text-center text-sm text-slate-500">No companies match the filters.</p> : null}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Contacts workspace</p>
              <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{selectedCompany?.company_name ?? "All contacts"}</h2>
              <p className="text-xs text-slate-500">{visibleContacts.length} contacts · {selectedCompany?.open_opportunities ?? state.displayedRows.reduce((sum, row) => sum + (row.open_opportunities ?? 0), 0)} open opportunities</p>
            </div>
            <div className="flex gap-2">
              {selectedCompany ? (
                <Link href={companyDrawerHref("/admin/companies", state.searchParams, selectedCompany.id, "overview")} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Open company
                </Link>
              ) : null}
              <Link href={selectedCompany ? `/admin/contacts/new?company_id=${selectedCompany.id}` : "/admin/contacts/new"} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                + Contact
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Coverage</th>
                  <th className="px-4 py-3 font-medium">Last contact</th>
                  <th className="px-4 py-3 font-medium">Open opportunities</th>
                </tr>
              </thead>
              <tbody>
                {visibleContacts.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No contacts linked to this company yet.</td></tr>
                ) : visibleContacts.map((contact) => (
                  <tr key={contact.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/companies?contact=${encodeURIComponent(contact.business_id ?? contact.v1_contact_id ?? String(contact.id))}`}
                        className="font-semibold text-violet-900 underline-offset-2 hover:underline"
                      >
                        {contact.contact_name}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">{contact.email ?? contact.company_name ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span>{formatCompanyRoles(contact.contact_role) || "—"}</span>
                      {contact.contact_role.some((role) => role === "referrer" || role === "agency") ? (
                        <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">Channel</span>
                      ) : null}
                    </td>
                    <td className="max-w-[14rem] px-4 py-3 text-slate-600">
                      <span className="line-clamp-2">{formatCoverage(contact.coverage)}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {contact.last_activity_date?.slice(0, 10) ?? contact.last_contact_date?.slice(0, 10) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{contact.open_opportunities ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
