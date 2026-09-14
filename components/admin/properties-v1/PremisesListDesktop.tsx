"use client";

import { updatePremisesV1Action } from "@/app/admin/properties/actions";
import { PremisesDrawer } from "@/components/admin/properties-v1/PremisesDrawer";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { SortableTableHeader } from "@/components/admin/SortableTableHeader";
import { PremisesCentreStatusIcon } from "@/components/admin/properties-v1/PremisesCentreStatusIcon";
import { PremisesRelatedCompaniesCell } from "@/components/admin/properties-v1/PremisesRelatedCompaniesCell";
import { formatAreaSqft } from "@/lib/formatCurrency";
import { premisesProductSubtypeLabel } from "@/lib/v1ListValues";
import {
  formatPremisesListLabel,
  formatPremisesName,
  formatPremisesUpdatedAt,
} from "@/lib/premisesDisplay";
import { premisesDrawerHref } from "@/lib/premisesDrawerNav";
import {
  resolvePremisesFlatListFilters,
  usePremisesFlatList,
  type PremisesListComponentProps,
  type SortKey,
} from "@/components/admin/properties-v1/usePremisesFlatList";
import { ADMIN_LIST_SCROLL_VIEWPORT_CLASS } from "@/lib/adminListViewport";

const colFilterClass =
  "mt-1 w-full min-w-[5rem] rounded border border-slate-200 px-1.5 py-1 text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:border-[#60A5FA] focus:outline-none focus:ring-1 focus:ring-[#EFF6FF]";

function PremisesSortableHeader({
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
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterPlaceholder?: string;
}) {
  return (
    <SortableTableHeader
      label={label}
      sortKey={sortKey}
      activeKey={activeKey}
      sortDir={sortDir}
      onSort={onSort}
    >
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
    </SortableTableHeader>
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
    <div className={props.fillHeight ? "flex min-h-0 flex-1 flex-col overflow-clip" : undefined}>
      <div className={props.fillHeight ? "shrink-0" : undefined}>
        <ListingRecordCount
          filteredCount={displayedRows.length}
          totalCount={totalCount}
          label="Premises"
          selectedCount={selectedCount}
          className={props.fillHeight ? "mb-1" : undefined}
        />
      </div>

      <div
        className={`${
          props.fillHeight
            ? "admin-list-scroll min-h-0 flex-1 overflow-x-auto overflow-y-scroll overscroll-y-contain"
            : ADMIN_LIST_SCROLL_VIEWPORT_CLASS
        } rounded-xl border border-[#BFDBFE]/70 bg-white`}
      >
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-[#F8FBFF] text-left text-slate-600 shadow-[inset_0_-1px_0_0_rgb(191,219,254)]">
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
              <PremisesSortableHeader
                label="Premises"
                sortKey="premises"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <PremisesSortableHeader
                label="Related Companies"
                sortKey="operator"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <PremisesSortableHeader
                label="Subtype"
                sortKey="subtype"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <PremisesSortableHeader
                label="Gross area"
                sortKey="gross_area"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <PremisesSortableHeader
                label={priceHeaders.price}
                sortKey="price"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <PremisesSortableHeader
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
                  <tr key={row.premises_id} className="border-t border-slate-100 hover:bg-[#EFF6FF]/50">
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
                      <div className="flex items-start gap-2">
                        <PremisesCentreStatusIcon status={row.centre_status} />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => openView(row.premises_id)}
                            className={`text-left text-sm font-medium underline-offset-2 hover:underline ${theme.link}`}
                          >
                            {formatPremisesListLabel(row.building_name_en, row.floor, row.unit)}
                          </button>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                            <RecordBusinessId id={row.business_id ?? row.premises_id} />
                            {row.district_en?.trim() ? (
                              <>
                                <span aria-hidden>·</span>
                                <span>{row.district_en}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-slate-700">
                      <PremisesRelatedCompaniesCell
                        operatorName={row.operator_name}
                        landlordName={row.landlord_name}
                        occupantName={row.occupant_name}
                        sourceName={row.source_name}
                        operatorId={row.operator_company_id}
                        landlordId={row.landlord_company_id || row.owner_company_id}
                        occupantId={row.current_tenant_company_id}
                        sourceId={row.source_company_id}
                        ownerId={row.owner_company_id}
                        relationshipLines={row.relationship_lines}
                        companies={companies}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-slate-700">
                      {premisesProductSubtypeLabel(row.product_subtype, row.asset_class)}
                    </td>
                    <td className="px-3 py-1.5 text-slate-700">{formatAreaSqft(row.gross_area_sqft)}</td>
                    <td className="px-3 py-1.5 text-slate-700">{prices.price}</td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-slate-700">{formatPremisesUpdatedAt(row.updated_at)}</td>
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
    </div>
  );
}
