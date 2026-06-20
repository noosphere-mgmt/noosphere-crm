"use client";

import Link from "next/link";
import { updatePremisesV1Action } from "@/app/admin/properties/actions";
import { PremisesDrawer } from "@/components/admin/properties-v1/PremisesDrawer";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { MobileCard, MobileCardMeta, MobileCardTitle } from "@/components/admin/mobile/MobileCard";
import { formatAreaSqft } from "@/lib/formatCurrency";
import { formatPremisesCompactLabel } from "@/lib/premisesDisplay";
import { formatListingStatus } from "@/lib/premisesListing";
import { premisesDrawerHref } from "@/lib/premisesDrawerNav";
import {
  buildingDetailsHref,
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
    selectedCount,
    openView,
    closeDrawer,
    setMode,
    theme,
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

      <div className="space-y-2">
        {displayedRows.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-slate-500">
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
              <MobileCard key={row.premises_id} onClick={() => openView(row.premises_id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <MobileCardTitle>
                      {row.building_name_en ? (
                        <>
                          <Link
                            href={buildingDetailsHref(row.property_id)}
                            className={theme.link}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {row.building_name_en}
                          </Link>
                          {premiseLabel ? (
                            <span className="font-semibold text-slate-900"> · {premiseLabel}</span>
                          ) : null}
                        </>
                      ) : (
                        premiseLabel || "Unnamed premise"
                      )}
                    </MobileCardTitle>
                    {metaParts.length > 0 ? (
                      <MobileCardMeta>{metaParts.join(" · ")}</MobileCardMeta>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                    {prices.price}
                  </span>
                </div>
              </MobileCard>
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
