"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { bulkDeleteContactsAction, bulkDuplicateContactsAction, duplicateContactAction } from "@/app/admin/contacts/actions";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import {
  SortableTableHeader,
  compareSortText,
  nextSortState,
  type SortDir,
} from "@/components/admin/SortableTableHeader";
import { ConnectionsRelationshipTypeFilters } from "@/components/admin/connections/ConnectionsRelationshipTypeFilters";
import { ConnectionsModuleHeader } from "@/components/admin/connections/ConnectionsModuleHeader";
import { ConnectionsSearchToolbarDesktop } from "@/components/admin/connections/ConnectionsSearchToolbarDesktop";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import type { ConnectionsCompaniesListState } from "@/components/admin/connections/useConnectionsCompaniesList";
import { companyDrawerHref, contactDrawerHref } from "@/lib/connectionsDrawerNav";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { formatCompanyRoles, formatCoverage } from "@/lib/connectionsDisplay";
import {
  contactsForCompanyShortlist,
  contactsWithoutCompany,
  companyMatchesGlobalSearch,
  companyMatchesNameNotesSearch,
  contactMatchesGlobalSearch,
  contactMatchesQuickFilters,
} from "@/lib/connectionsList";
import { companyFullPageHref } from "@/lib/crmDetailNav";
import { getContactLabel } from "@/lib/contactName";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import { ADMIN_LIST_SCROLL_VIEWPORT_CLASS } from "@/lib/adminListViewport";
import { contactBusinessExportId } from "@/lib/exportBusinessIds";
import type { Contact } from "@/lib/types/entities";

type CompanySelection = "all" | "individual" | number;
type ContactSortKey =
  | "name"
  | "company"
  | "role"
  | "coverage"
  | "last_contact"
  | "opportunities";

function compareSortNum(a: number, b: number, dir: SortDir): number {
  const cmp = a - b;
  return dir === "asc" ? cmp : -cmp;
}

const selectedRowClass = "bg-[#F5F3FF] font-semibold text-[#5B21B6] ring-1 ring-[#DDD6FE]";
const selectedSoftRowClass = "bg-[#F5F3FF] text-[#5B21B6] ring-1 ring-[#DDD6FE]";
const compactPrimaryButton =
  "rounded-lg bg-[#7C3AED] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#5B21B6]";
const primaryButton =
  "rounded-lg bg-[#7C3AED] px-3 py-2 text-sm font-semibold text-white hover:bg-[#5B21B6]";
const accentLabel = "text-xs font-semibold uppercase tracking-wide text-[#7C3AED]";
const channelBadge = "ml-2 rounded-full bg-[#F5F3FF] px-2 py-0.5 text-[11px] font-semibold text-[#5B21B6]";
const openIconClass = "mt-2 rounded-md px-2 py-1 text-[#7C3AED] opacity-70 hover:bg-white hover:opacity-100";
const metaHoverClass = "mt-1 block text-left text-[11px] text-slate-500 hover:text-[#7C3AED]";
const companyColumnSearchClass = `mt-2 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 ${connectionsGlassClasses.inputFocus} disabled:bg-slate-100 disabled:text-slate-400`;

const CONTACTS_LIST_PATH = "/admin/contacts";

/** Desktop split: company rail (filter) + contacts workspace — Contacts main listing (aligned with Premises). */
export function ConnectionsCompaniesDesktop({
  state,
  contacts,
  onNewContact,
}: {
  state: ConnectionsCompaniesListState;
  contacts: Contact[];
  onNewContact?: (companyId?: number) => void;
}) {
  const router = useRouter();
  const theme = moduleAccentClasses("connections");
  const [selection, setSelection] = useState<CompanySelection>("all");
  const [companyColumnSearch, setCompanyColumnSearch] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [contactSortKey, setContactSortKey] = useState<ContactSortKey>("name");
  const [contactSortDir, setContactSortDir] = useState<SortDir>("asc");
  const [contactBulkPending, startContactBulk] = useTransition();
  const previousRoleFilter = useRef(state.roleFilter);
  const individualContacts = useMemo(() => {
    return contactsWithoutCompany(contacts).filter(
      (contact) =>
        contactMatchesQuickFilters(contact, state.quickFilters) &&
        contactMatchesGlobalSearch(contact, state.searchQuery),
    );
  }, [contacts, state.quickFilters, state.searchQuery]);

  const visibleCompanies = useMemo(
    () =>
      state.displayedRows.filter((row) => companyMatchesNameNotesSearch(row, companyColumnSearch)),
    [state.displayedRows, companyColumnSearch],
  );
  const shortlistedCompanyIds = useMemo(
    () => new Set(visibleCompanies.map((row) => row.id)),
    [visibleCompanies],
  );
  const companiesById = useMemo(() => {
    const map = new Map(visibleCompanies.map((row) => [row.id, row]));
    return map;
  }, [visibleCompanies]);
  const shortlistedContacts = useMemo(
    () => contactsForCompanyShortlist(contacts, shortlistedCompanyIds),
    [contacts, shortlistedCompanyIds],
  );
  const visibleCompanySelectionIds = useMemo(
    () => visibleCompanies.map((row) => String(row.id)),
    [visibleCompanies],
  );
  const allVisibleCompaniesSelected =
    visibleCompanySelectionIds.length > 0 &&
    visibleCompanySelectionIds.every((id) => state.selected.has(id));
  const checkedCompanyIds = useMemo(() => {
    const ids = new Set<number>();
    for (const row of visibleCompanies) {
      if (state.selected.has(String(row.id))) ids.add(row.id);
    }
    return ids;
  }, [visibleCompanies, state.selected]);
  const hasCheckedCompanies = checkedCompanyIds.size > 0;

  useEffect(() => {
    if (state.roleFilter === "individual") {
      setSelection("individual");
    } else if (previousRoleFilter.current === "individual") {
      setSelection("all");
    }
    previousRoleFilter.current = state.roleFilter;
  }, [state.roleFilter]);

  useEffect(() => {
    if (typeof selection === "number" && !shortlistedCompanyIds.has(selection)) {
      setSelection("all");
    }
  }, [selection, shortlistedCompanyIds]);

  const selectedCompany =
    typeof selection === "number"
      ? visibleCompanies.find((row) => row.id === selection) ?? null
      : null;

  const contactCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const contact of shortlistedContacts) {
      if (contact.company_id == null) continue;
      counts.set(contact.company_id, (counts.get(contact.company_id) ?? 0) + 1);
    }
    return counts;
  }, [shortlistedContacts]);

  const visibleContacts = useMemo(() => {
    let base: Contact[];
    if (selection === "individual" || state.roleFilter === "individual") {
      base = individualContacts;
    } else if (hasCheckedCompanies) {
      base = shortlistedContacts.filter(
        (contact) => contact.company_id != null && checkedCompanyIds.has(contact.company_id),
      );
    } else if (typeof selection === "number") {
      base = shortlistedContacts.filter((contact) => contact.company_id === selection);
    } else {
      base = shortlistedContacts;
    }

    const q = state.searchQuery.trim();
    const filtered = !q
      ? base
      : base.filter((contact) => {
          if (contactMatchesGlobalSearch(contact, q)) return true;
          if (contact.company_id == null) return false;
          const company = companiesById.get(contact.company_id);
          return company ? companyMatchesGlobalSearch(company, q) : false;
        });

    return [...filtered].sort((a, b) => {
      switch (contactSortKey) {
        case "name":
          return compareSortText(getContactLabel(a), getContactLabel(b), contactSortDir);
        case "company":
          return compareSortText(a.company_name, b.company_name, contactSortDir);
        case "role":
          return compareSortText(
            formatCompanyRoles(a.contact_role),
            formatCompanyRoles(b.contact_role),
            contactSortDir,
          );
        case "coverage":
          return compareSortText(
            formatCoverage(a.coverage),
            formatCoverage(b.coverage),
            contactSortDir,
          );
        case "last_contact":
          return compareSortText(
            a.last_activity_date ?? a.last_contact_date,
            b.last_activity_date ?? b.last_contact_date,
            contactSortDir,
          );
        case "opportunities":
          return compareSortNum(
            a.open_opportunities ?? 0,
            b.open_opportunities ?? 0,
            contactSortDir,
          );
        default:
          return 0;
      }
    });
  }, [
    selection,
    state.roleFilter,
    state.searchQuery,
    individualContacts,
    shortlistedContacts,
    companiesById,
    hasCheckedCompanies,
    checkedCompanyIds,
    contactSortKey,
    contactSortDir,
  ]);

  function handleContactSort(key: ContactSortKey) {
    const next = nextSortState(contactSortKey, contactSortDir, key, (k) =>
      k === "last_contact" || k === "opportunities" ? "desc" : "asc",
    );
    setContactSortKey(next.sortKey);
    setContactSortDir(next.sortDir);
  }

  const contactSelectionIds = useMemo(
    () => visibleContacts.map((contact) => String(contact.id)),
    [visibleContacts],
  );

  useEffect(() => {
    const visible = new Set(contactSelectionIds);
    setSelectedContacts((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (visible.has(id)) next.add(id);
        else changed = true;
      }
      return changed || next.size !== prev.size ? next : prev;
    });
  }, [contactSelectionIds]);

  const allContactsSelected =
    contactSelectionIds.length > 0 &&
    contactSelectionIds.every((id) => selectedContacts.has(id));
  const contactSelectedCount = selectedContacts.size;
  const someContactsSelected = contactSelectedCount > 0;
  const contactExportSelectedIds = useMemo(
    () =>
      visibleContacts
        .filter((contact) => selectedContacts.has(String(contact.id)))
        .map((contact) => contactBusinessExportId(contact))
        .filter(Boolean),
    [visibleContacts, selectedContacts],
  );
  const contactFilteredIds = useMemo(
    () => visibleContacts.map((contact) => contactBusinessExportId(contact)).filter(Boolean),
    [visibleContacts],
  );

  function toggleContact(id: string) {
    setSelectedContacts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllContacts(selectAll: boolean) {
    setSelectedContacts((prev) => {
      const next = new Set(prev);
      if (selectAll) contactSelectionIds.forEach((id) => next.add(id));
      else contactSelectionIds.forEach((id) => next.delete(id));
      return next;
    });
  }

  function onBulkDeleteContacts() {
    if (!someContactsSelected) return;
    if (!window.confirm(`Delete ${contactSelectedCount} selected contacts? This cannot be undone.`)) {
      return;
    }
    const formData = new FormData();
    formData.set("contact_ids", [...selectedContacts].join(","));
    formData.set("return_to", "/admin/companies");
    startContactBulk(() => {
      void bulkDeleteContactsAction(formData);
    });
  }

  function onBulkCopyContacts() {
    if (!someContactsSelected) return;
    const formData = new FormData();
    formData.set("contact_ids", [...selectedContacts].join(","));
    startContactBulk(async () => {
      const result = await bulkDuplicateContactsAction(formData);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      setSelectedContacts(new Set());
      router.refresh();
    });
  }

  function onDuplicateContact(contactId: number) {
    startContactBulk(async () => {
      const result = await duplicateContactAction(contactId);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  const openOpportunitiesTotal = useMemo(() => {
    if (selectedCompany) return selectedCompany.open_opportunities ?? 0;
    if (hasCheckedCompanies) {
      return visibleCompanies
        .filter((row) => checkedCompanyIds.has(row.id))
        .reduce((sum, row) => sum + (row.open_opportunities ?? 0), 0);
    }
    return visibleCompanies.reduce((sum, row) => sum + (row.open_opportunities ?? 0), 0);
  }, [selectedCompany, hasCheckedCompanies, visibleCompanies, checkedCompanyIds]);

  const workspaceTitle =
    selection === "individual" || state.roleFilter === "individual"
      ? "No Company"
      : hasCheckedCompanies
        ? checkedCompanyIds.size === 1
          ? (visibleCompanies.find((row) => checkedCompanyIds.has(row.id))?.company_name ??
            "Selected company")
          : `${checkedCompanyIds.size} selected companies`
        : selectedCompany?.company_name ?? "All contacts";

  function toggleCompanyChecked(companyId: number, rowId: string) {
    state.toggleOne(rowId);
    // Keep focus selection in sync when checking/unchecking a single company.
    setSelection((prev) => {
      const willSelect = !state.selected.has(rowId);
      if (willSelect) return companyId;
      if (prev === companyId) return "all";
      return prev;
    });
  }

  const showNoCompanyRow = state.roleFilter === null || state.roleFilter === "individual";
  const contactColSpan = selection === "all" ? 8 : 7;

  return (
    <>
      <ConnectionsModuleHeader
        actions={
          onNewContact ? (
            <button type="button" onClick={() => onNewContact()} className={theme.primaryButton}>
              New
            </button>
          ) : (
            <Link href="/admin/contacts/new" className={theme.primaryButton}>
              New
            </Link>
          )
        }
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
        onAfterReset={() => setCompanyColumnSearch("")}
      />

      <div className="mt-3 grid min-h-[65vh] grid-cols-[20rem_minmax(0,1fr)] gap-4">
        <aside className="flex max-h-[calc(34rem+5.5rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2">
                <input
                  type="checkbox"
                  aria-label="Select all companies"
                  checked={allVisibleCompaniesSelected}
                  onChange={(e) => state.toggleAll(visibleCompanySelectionIds, e.target.checked)}
                  className="mt-1 rounded border-slate-300"
                  disabled={state.roleFilter === "individual"}
                />
                <div>
                  <h2 className="font-semibold text-slate-900">Companies</h2>
                  <p className="text-xs text-slate-500">
                    {state.roleFilter === "individual"
                      ? `${individualContacts.length} individuals`
                      : `${visibleCompanies.length} of ${state.rows.length}`}
                    {state.selectedCount > 0 ? ` · ${state.selectedCount} selected` : ""}
                  </p>
                </div>
              </div>
              <Link href="/admin/companies/new" className={compactPrimaryButton}>
                + Company
              </Link>
            </div>
            <input
              type="search"
              value={companyColumnSearch}
              onChange={(e) => setCompanyColumnSearch(e.target.value)}
              placeholder="Search company name, notes…"
              aria-label="Search company names and notes"
              disabled={state.roleFilter === "individual"}
              className={companyColumnSearchClass}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {state.roleFilter === "individual" ? null : (
              <button
                type="button"
                onClick={() => setSelection("all")}
                className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm ${
                  selection === "all" ? selectedRowClass : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>All companies</span>
                <span className="text-xs tabular-nums text-slate-500">{shortlistedContacts.length}</span>
              </button>
            )}
            {showNoCompanyRow ? (
              <button
                type="button"
                onClick={() => setSelection("individual")}
                className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm ${
                  selection === "individual" ? selectedRowClass : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>No Company</span>
                <span className="text-xs tabular-nums text-slate-500">{individualContacts.length}</span>
              </button>
            ) : null}
            {state.roleFilter === "individual"
              ? null
              : visibleCompanies.map((company) => {
                  const rowId = String(company.id);
                  const selected = selection === company.id;
                  return (
                    <div
                      key={company.id}
                      className={`group mb-1 flex items-start gap-1 rounded-lg pr-1 ${
                        selected ? selectedSoftRowClass : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-2 px-3 py-2.5 text-left text-sm">
                        <input
                          type="checkbox"
                          aria-label={`Select ${company.company_name}`}
                          checked={state.selected.has(rowId)}
                          onChange={() => toggleCompanyChecked(company.id, rowId)}
                          className="mt-0.5 rounded border-slate-300"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="min-w-0 flex-1">
                          <AdminEntityLink
                            href={companyFullPageHref(
                              company.business_id ?? company.v1_company_id ?? company.id,
                            )}
                            className={`line-clamp-2 font-medium text-[#5B21B6] underline-offset-2 hover:underline ${
                              selected ? "font-semibold" : ""
                            }`}
                          >
                            {company.company_name}
                          </AdminEntityLink>
                          {company.company_name_zh ? (
                            <span className="mt-0.5 block text-xs text-slate-500">{company.company_name_zh}</span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setSelection(company.id)}
                            className={metaHoverClass}
                            title="Show this company's contacts"
                          >
                            {contactCounts.get(company.id) ?? 0} contacts · {company.open_opportunities ?? 0}{" "}
                            open opps
                          </button>
                        </div>
                      </div>
                      <Link
                        href={companyDrawerHref("/admin/companies", state.searchParams, company.id)}
                        scroll={false}
                        aria-label={`Open ${company.company_name}`}
                        title="Open company drawer"
                        className={openIconClass}
                      >
                        ↗
                      </Link>
                    </div>
                  );
                })}
            {state.roleFilter !== "individual" && visibleCompanies.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">
                No companies match the current filters.
              </p>
            ) : null}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div>
              <p className={accentLabel}>Contacts workspace</p>
              <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{workspaceTitle}</h2>
              <p className="text-xs text-slate-500">
                {visibleContacts.length} contacts
                {contactSelectedCount > 0 ? ` · ${contactSelectedCount} selected` : ""}
                {selection === "individual" || state.roleFilter === "individual"
                  ? " · individuals"
                  : ` · ${openOpportunitiesTotal} open opportunities`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ModuleListingBulkActions
                module="connections"
                importObjectType="contacts"
                selectedCount={contactSelectedCount}
                someSelected={someContactsSelected}
                selectedIds={contactExportSelectedIds}
                filteredIds={contactFilteredIds}
                isPending={contactBulkPending}
                onDelete={onBulkDeleteContacts}
                onCopy={onBulkCopyContacts}
                copyTitle="Copy selected"
              />
              {selectedCompany ? (
                <AdminEntityLink
                  href={companyFullPageHref(
                    selectedCompany.business_id ?? selectedCompany.v1_company_id ?? selectedCompany.id,
                  )}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Open company
                </AdminEntityLink>
              ) : null}
              {onNewContact ? (
                <button
                  type="button"
                  onClick={() => onNewContact(selectedCompany?.id)}
                  className={primaryButton}
                >
                  + Contact
                </button>
              ) : (
                <Link
                  href={
                    selectedCompany
                      ? `/admin/contacts/new?company_id=${selectedCompany.id}`
                      : "/admin/contacts/new"
                  }
                  className={primaryButton}
                >
                  + Contact
                </Link>
              )}
            </div>
          </div>

          <div className={`${ADMIN_LIST_SCROLL_VIEWPORT_CLASS} rounded-xl border border-slate-200 bg-white`}>
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 shadow-[inset_0_-1px_0_0_rgb(226,232,240)]">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all contacts"
                      checked={allContactsSelected}
                      onChange={(e) => toggleAllContacts(e.target.checked)}
                      className="rounded border-slate-300"
                      disabled={visibleContacts.length === 0}
                    />
                  </th>
                  <SortableTableHeader
                    label="Contact"
                    sortKey="name"
                    activeKey={contactSortKey}
                    sortDir={contactSortDir}
                    onSort={handleContactSort}
                    className="px-4 py-3"
                  />
                  {selection === "all" ? (
                    <SortableTableHeader
                      label="Company"
                      sortKey="company"
                      activeKey={contactSortKey}
                      sortDir={contactSortDir}
                      onSort={handleContactSort}
                      className="px-4 py-3"
                    />
                  ) : null}
                  <SortableTableHeader
                    label="Role"
                    sortKey="role"
                    activeKey={contactSortKey}
                    sortDir={contactSortDir}
                    onSort={handleContactSort}
                    className="px-4 py-3"
                  />
                  <SortableTableHeader
                    label="Coverage"
                    sortKey="coverage"
                    activeKey={contactSortKey}
                    sortDir={contactSortDir}
                    onSort={handleContactSort}
                    className="px-4 py-3"
                  />
                  <SortableTableHeader
                    label="Last contact"
                    sortKey="last_contact"
                    activeKey={contactSortKey}
                    sortDir={contactSortDir}
                    onSort={handleContactSort}
                    className="px-4 py-3"
                  />
                  <SortableTableHeader
                    label="Open opportunities"
                    sortKey="opportunities"
                    activeKey={contactSortKey}
                    sortDir={contactSortDir}
                    onSort={handleContactSort}
                    className="px-4 py-3"
                  />
                  <th className="w-24 px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleContacts.length === 0 ? (
                  <tr>
                    <td colSpan={contactColSpan} className="px-4 py-10 text-center text-slate-500">
                      {selection === "individual" || state.roleFilter === "individual"
                        ? "No individual contacts without a company."
                        : "No contacts in this company shortlist."}
                    </td>
                  </tr>
                ) : (
                  visibleContacts.map((contact) => {
                    const contactId = String(contact.id);
                    return (
                      <tr key={contact.id} className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            aria-label={`Select ${getContactLabel(contact)}`}
                            checked={selectedContacts.has(contactId)}
                            onChange={() => toggleContact(contactId)}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <AdminEntityLink
                            href={contactDrawerHref(
                              CONTACTS_LIST_PATH,
                              state.searchParams,
                              contact.business_id ?? contact.v1_contact_id ?? contact.id,
                            )}
                            className={`${connectionsGlassClasses.link} underline-offset-2 hover:underline`}
                          >
                            {getContactLabel(contact)}
                          </AdminEntityLink>
                          <RecordBusinessId
                            id={contact.business_id ?? contact.v1_contact_id}
                            className="mt-0.5 block"
                          />
                        </td>
                        {selection === "all" ? (
                          <td className="px-4 py-3 text-slate-600">
                            <div className="flex flex-col gap-0.5">
                              <AdminEntityLink
                                href={companyFullPageHref(contact.company_business_id ?? contact.company_id)}
                                className={`${connectionsGlassClasses.link} underline-offset-2 hover:underline`}
                                fallback="No Company"
                              >
                                {contact.company_name}
                              </AdminEntityLink>
                              {contact.company_name_zh ? (
                                <span className="text-xs text-slate-500">{contact.company_name_zh}</span>
                              ) : null}
                            </div>
                          </td>
                        ) : null}
                        <td className="px-4 py-3 text-slate-600">
                          <span>{formatCompanyRoles(contact.contact_role) || "—"}</span>
                          {contact.contact_role.some((role) => role === "referrer" || role === "agency") ? (
                            <span className={channelBadge}>Channel</span>
                          ) : null}
                        </td>
                        <td className="max-w-[14rem] px-4 py-3 text-slate-600">
                          <span className="line-clamp-2">{formatCoverage(contact.coverage)}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {contact.last_activity_date?.slice(0, 10) ??
                            contact.last_contact_date?.slice(0, 10) ??
                            "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{contact.open_opportunities ?? 0}</td>
                        <td className="px-4 py-3">
                          <ModuleRowActions
                            module="connections"
                            viewHref={contactDrawerHref(
                              CONTACTS_LIST_PATH,
                              state.searchParams,
                              contact.business_id ?? contact.v1_contact_id ?? contact.id,
                              "overview",
                            )}
                            editHref={contactDrawerHref(
                              CONTACTS_LIST_PATH,
                              state.searchParams,
                              contact.business_id ?? contact.v1_contact_id ?? contact.id,
                              "overview",
                              "edit",
                            )}
                            onDuplicate={
                              contactBulkPending ? undefined : () => onDuplicateContact(contact.id)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
