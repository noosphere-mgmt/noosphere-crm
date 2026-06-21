"use client";

import { updatePremisesV1Action } from "@/app/admin/properties/actions";
import { PremisesDrawer } from "@/components/admin/properties-v1/PremisesDrawer";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { MobileCardMeta } from "@/components/admin/mobile/MobileCard";
import { formatAreaSqft } from "@/lib/formatCurrency";
import { formatPremisesCompactLabel } from "@/lib/premisesDisplay";
import { formatListingStatus } from "@/lib/premisesListing";
import { premisesDrawerHref } from "@/lib/premisesDrawerNav";
import {
  resolvePremisesFlatListFilters,
  usePremisesFlatList,
  type PremisesListComponentProps,
} from "@/components/admin/properties-v1/usePremisesFlatList";

export function PremisesListMobile(props: PremisesListComponentProps) {
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
    openPremises,
    displayedRows,
    selected,
    selectedCount,
    allSelected,
    handleToggleAll,
    toggleOneRow,
    openView,
    closeDrawer,
    setMode,
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
    { drawerViewport: "mobile" },
  );

  return (
    <>
      <ListingRecordCount
        filteredCount={displayedRows.length}
        totalCount={totalCount}
        label="Premises"
        selectedCount={selectedCount}
      />

      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {displayedRows.length > 0 ? (
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleToggleAll}
              aria-label="Select all premises"
              className="rounded border-slate-300"
            />
            <span className="text-xs text-slate-500">Select all</span>
          </div>
        ) : null}

        {displayedRows.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            {rows.length === 0 ? "No premises yet." : "No premises match your filters."}
          </p>
        ) : (
          displayedRows.map((row) => {
            const prices = getPremisesRowPriceDisplay(row);
            const premiseLabel = formatPremisesCompactLabel(row.floor, row.unit);
            const metaParts = [
              row.district_en,
              row.operator_name,
              formatAreaSqft(row.gross_area_sqft) !== "—" ? formatAreaSqft(row.gross_area_sqft) : null,
              formatListingStatus(row.offer_status),
            ].filter(Boolean);

            return (
              <div
                key={row.premises_id}
                className="flex items-start gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={selected.has(row.premises_id)}
                  onChange={() => toggleOneRow(row.premises_id)}
                  aria-label={`Select ${premiseLabel || row.premises_id}`}
                  className="mt-1 rounded border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => openView(row.premises_id)}
                  className="min-w-0 flex-1 cursor-pointer text-left active:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm leading-snug">
                        {row.building_name_en?.trim() ? (
                          <>
                            <span className="font-semibold text-slate-900">{row.building_name_en.trim()}</span>
                            <span className="text-slate-400"> · </span>
                          </>
                        ) : null}
                        <span className="font-bold text-blue-800">
                          {premiseLabel !== "—" ? premiseLabel : "Unnamed premise"}
                        </span>
                      </p>
                      {metaParts.length > 0 ? (
                        <MobileCardMeta>{metaParts.join(" · ")}</MobileCardMeta>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                      {prices.price}
                    </span>
                  </div>
                </button>
              </div>
            );
          })
        )}
      </div>

      <PremisesDrawer
        premises={openPremises}
        propertyId={openPremises?.property_id ?? ""}
        buildingName={openPremises?.building_name_en ?? null}
        mode="view"
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
