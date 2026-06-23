"use client";

import Link from "next/link";
import { updatePremisesV1Action } from "@/app/admin/properties/actions";
import { PremisesDrawer } from "@/components/admin/properties-v1/PremisesDrawer";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { formatAreaSqft } from "@/lib/formatCurrency";
import { formatPremisesCompactLabel, formatPremisesName, formatVerifiedDate } from "@/lib/premisesDisplay";
import { formatListingStatus } from "@/lib/premisesListing";
import { premisesDrawerHref } from "@/lib/premisesDrawerNav";
import {
  buildingDetailsHref,
  resolvePremisesFlatListFilters,
  usePremisesFlatList,
  type PremisesListComponentProps,
  type SortDir,
  type SortKey,
} from "@/components/admin/properties-v1/usePremisesFlatList";

const colFilterClass =
  "mt-1 w-full min-w-[5rem] rounded border border-slate-200 px-1.5 py-1 text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:border-[#60A5FA] focus:outline-none focus:ring-1 focus:ring-[#EFF6FF]";

function SortableHeader({
  label,
  sortKey,
  activeKey,
  sortDir,
  onSort,
  filterValue,
  onFilterChange,
  filterPlaceholder,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterPlaceholder?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <th className="px-3 py-1.5 align-top font-medium">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 text-left hover:text-slate-900"
      >
        <span>{label}</span>
        {active ? <span className="text-slate-500">{sortDir === "asc" ? "↑" : "↓"}</span> : null}
      </button>
      {onFilterChange ? (
        <input
          type="search"
          value={filterValue ?? ""}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder={filterPlaceholder}
          aria-label={`Filter ${label}`}
          className={colFilterClass}
          onClick={(e) => e.stopPropagation()}
        />
      ) : null}
    </th>
  );
}

export function PremisesListDesktop(props: PremisesListComponentProps) {
  const initialFilters = resolvePremisesFlatListFilters(props);
  const {
    rows,
    totalCount,
    companies,
    contacts,
    propertyOptions,
    drawerData,
    searchParams,
    activeTab,
    drawerMode,
    sortKey,
    sortDir,
    colFilters,
    setColFilters,
    priceHeaders,
    openPremises,
    displayedRows,
    selected,
    selectedCount,
    allSelected,
    handleToggleAll,
    toggleOneRow,
    handleSort,
    openView,
    openEdit,
    closeDrawer,
    setMode,
    theme,
    colSpan,
    getPremisesRowPriceDisplay,
  } = usePremisesFlatList(
    {
      rows: props.rows,
      totalCount: props.totalCount,
      initialFilters,
      companies: props.companies,
      contacts: props.contacts,
      propertyOptions: props.propertyOptions,
      drawerData: props.drawerData,
    },
    { drawerViewport: "desktop" },
  );

  return (
    <>
      <ListingRecordCount
        filteredCount={displayedRows.length}
        totalCount={totalCount}
        label="Premises"
        selectedCount={selectedCount}
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="w-10 px-3 py-1.5 align-top">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleToggleAll}
                  aria-label="Select all premises"
                  className="rounded border-slate-300"
                />
              </th>
              <SortableHeader
                label="Premises"
                sortKey="premises"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                filterValue={colFilters.premises}
                onFilterChange={(v) => setColFilters((f) => ({ ...f, premises: v }))}
                filterPlaceholder="Filter…"
              />
              <SortableHeader
                label="District"
                sortKey="district"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                filterValue={colFilters.district}
                onFilterChange={(v) => setColFilters((f) => ({ ...f, district: v }))}
                filterPlaceholder="Filter…"
              />
              <SortableHeader
                label="Operator"
                sortKey="operator"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                filterValue={colFilters.operator}
                onFilterChange={(v) => setColFilters((f) => ({ ...f, operator: v }))}
                filterPlaceholder="Filter…"
              />
              <SortableHeader
                label="Desks"
                sortKey="desks"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label="Gross area"
                sortKey="gross_area"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label={priceHeaders.price}
                sortKey="price"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label={priceHeaders.psf}
                sortKey="psf"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label="Listing Status"
                sortKey="listing_status"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label="Updated"
                sortKey="updated"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <th className="w-24 px-3 py-1.5 align-top font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
                  No premises match your filters.
                </td>
              </tr>
            ) : displayedRows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
                  No premises match your column filters.
                </td>
              </tr>
            ) : (
              displayedRows.map((row) => {
                const prices = getPremisesRowPriceDisplay(row);
                return (
                  <tr key={row.premises_id} className="border-t border-slate-100">
                    <td className="px-3 py-1.5">
                      <input
                        type="checkbox"
                        checked={selected.has(row.premises_id)}
                        onChange={() => toggleOneRow(row.premises_id)}
                        aria-label={`Select ${formatPremisesName(row.building_name_en, row.floor, row.unit)}`}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      {row.building_name_en ? (
                        <Link
                          href={buildingDetailsHref(row.property_id)}
                          className={`mb-0.5 block text-xs ${theme.link}`}
                        >
                          {row.building_name_en}
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        className={`text-left ${theme.link}`}
                        onClick={() => openView(row.premises_id)}
                      >
                        {formatPremisesCompactLabel(row.floor, row.unit)}
                      </button>
                      <RecordBusinessId id={row.premises_id} className="mt-0.5 block" />
                    </td>
                    <td className="px-3 py-1.5 text-slate-700">{row.district_en ?? "—"}</td>
                    <td className="px-3 py-1.5 text-slate-700">{row.operator_name ?? "—"}</td>
                    <td className="px-3 py-1.5 text-slate-700">{row.workstation_count ?? "—"}</td>
                    <td className="px-3 py-1.5 text-slate-700">{formatAreaSqft(row.gross_area_sqft)}</td>
                    <td className="px-3 py-1.5 text-slate-700">{prices.price}</td>
                    <td className="px-3 py-1.5 text-slate-700">{prices.psf}</td>
                    <td className="px-3 py-1.5 text-slate-700">{formatListingStatus(row.offer_status)}</td>
                    <td className="px-3 py-1.5 text-slate-700">{formatVerifiedDate(row.last_verified_date)}</td>
                    <td className="px-3 py-1.5">
                      <ModuleRowActions
                        module="properties"
                        onView={() => openView(row.premises_id)}
                        onEdit={() => openEdit(row.premises_id)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PremisesDrawer
        premises={openPremises}
        propertyId={openPremises?.property_id ?? ""}
        buildingName={openPremises?.building_name_en ?? null}
        mode={drawerMode}
        onClose={closeDrawer}
        onModeChange={setMode}
        action={updatePremisesV1Action}
        companies={companies}
        contacts={contacts}
        propertyOptions={propertyOptions}
        drawerData={drawerData}
        returnTo={
          openPremises
            ? premisesDrawerHref(searchParams, openPremises.premises_id, activeTab, "view")
            : undefined
        }
      />
    </>
  );
}
