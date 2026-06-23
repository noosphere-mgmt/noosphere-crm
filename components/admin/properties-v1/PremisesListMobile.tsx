"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePremisesV1Action } from "@/app/admin/properties/actions";
import { PremisesDrawer } from "@/components/admin/properties-v1/PremisesDrawer";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { MobileCardMeta } from "@/components/admin/mobile/MobileCard";
import { confirmDeletePremises } from "@/components/admin/mobile/mobileListDelete";
import {
  MobileSwipeDeleteGroup,
  MobileSwipeToDeleteRow,
} from "@/components/admin/mobile/MobileSwipeToDeleteRow";
import { formatAreaSqft } from "@/lib/formatCurrency";
import { formatPremisesListLabel, formatPremisesName } from "@/lib/premisesDisplay";
import { formatListingStatus } from "@/lib/premisesListing";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { premisesDrawerHref } from "@/lib/premisesDrawerNav";
import {
  resolvePremisesFlatListFilters,
  usePremisesFlatList,
  type PremisesListComponentProps,
} from "@/components/admin/properties-v1/usePremisesFlatList";

export function PremisesListMobile(props: PremisesListComponentProps) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();
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

  function deletePremisesRow(premisesId: string, buildingName: string | null, floor: string | null, unit: string | null) {
    const label = formatPremisesName(buildingName, floor, unit);
    startDelete(async () => {
      const deleted = await confirmDeletePremises(label, premisesId);
      if (!deleted) return;
      if (openPremises?.premises_id === premisesId) {
        closeDrawer();
      }
      router.refresh();
    });
  }

  return (
    <>
      <ListingRecordCount
        filteredCount={displayedRows.length}
        totalCount={totalCount}
        label="Premises"
      />

      <MobileSwipeDeleteGroup>
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {displayedRows.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              {rows.length === 0 ? "No premises yet." : "No premises match your filters."}
            </p>
          ) : (
            displayedRows.map((row) => {
              const prices = getPremisesRowPriceDisplay(row);
              const listLabel = formatPremisesListLabel(row.building_name_en, row.floor, row.unit);
              const metaParts = [
                row.district_en,
                row.operator_name,
                formatAreaSqft(row.gross_area_sqft) !== "—" ? formatAreaSqft(row.gross_area_sqft) : null,
                formatListingStatus(row.offer_status),
              ].filter(Boolean);

              return (
                <MobileSwipeToDeleteRow
                  key={row.premises_id}
                  rowId={row.premises_id}
                  disabled={isDeleting}
                  deleteLabel={`Delete ${listLabel}`}
                  onDelete={() =>
                    deletePremisesRow(row.premises_id, row.building_name_en, row.floor, row.unit)
                  }
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <div className="px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={premisesDrawerHref(searchParams, row.premises_id, "overview", "view")}
                          className="block truncate text-sm font-semibold text-blue-800 underline-offset-2 hover:underline"
                        >
                          {listLabel !== "—" ? listLabel : "Unnamed premise"}
                        </Link>
                        <RecordBusinessId id={row.premises_id} className="mt-0.5 block" />
                        {metaParts.length > 0 ? (
                          <MobileCardMeta>{metaParts.join(" · ")}</MobileCardMeta>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                        {prices.price}
                      </span>
                    </div>
                  </div>
                </MobileSwipeToDeleteRow>
              );
            })
          )}
        </div>
      </MobileSwipeDeleteGroup>

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
