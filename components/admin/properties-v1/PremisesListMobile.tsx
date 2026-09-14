"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePremisesV1Action } from "@/app/admin/properties/actions";
import { PremisesDrawer } from "@/components/admin/properties-v1/PremisesDrawer";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { MobileCardMeta } from "@/components/admin/mobile/MobileCard";
import { confirmDeletePremises } from "@/components/admin/mobile/mobileListDelete";
import {
  MobileSwipeDeleteGroup,
  MobileSwipeToDeleteRow,
} from "@/components/admin/mobile/MobileSwipeToDeleteRow";
import { formatAreaSqft } from "@/lib/formatCurrency";
import { premisesProductSubtypeLabel } from "@/lib/v1ListValues";
import {
  formatPremisesListLabel,
  formatPremisesName,
} from "@/lib/premisesDisplay";
import { PremisesCentreStatusIcon } from "@/components/admin/properties-v1/PremisesCentreStatusIcon";
import { PremisesRelatedCompaniesCell } from "@/components/admin/properties-v1/PremisesRelatedCompaniesCell";
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
        <div className="space-y-2">
          {displayedRows.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              {rows.length === 0 ? "No premises yet." : "No premises match your filters."}
            </p>
          ) : (
            displayedRows.map((row) => {
              const prices = getPremisesRowPriceDisplay(row);
              const listLabel = formatPremisesListLabel(row.building_name_en, row.floor, row.unit);
              const area = formatAreaSqft(row.gross_area_sqft);
              const subtype = premisesProductSubtypeLabel(row.product_subtype, row.asset_class);

              return (
                <MobileSwipeToDeleteRow
                  key={row.premises_id}
                  rowId={row.premises_id}
                  disabled={isDeleting}
                  deleteLabel={`Delete ${listLabel}`}
                  onDelete={() =>
                    deletePremisesRow(row.premises_id, row.building_name_en, row.floor, row.unit)
                  }
                  className="rounded-xl border border-l-4 border-[#BFDBFE] border-l-[#60A5FA] bg-white shadow-[0_4px_14px_rgba(37,99,235,0.08)]"
                >
                  <div className="bg-white px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <PremisesCentreStatusIcon status={row.centre_status} />
                          <button
                            type="button"
                            onClick={() => openView(row.premises_id)}
                            className="block min-w-0 w-full truncate text-left text-sm font-semibold text-[#1D4ED8] underline-offset-2 hover:underline active:text-[#2563EB]"
                          >
                            {listLabel !== "—" ? listLabel : "Unnamed premise"}
                          </button>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                          <RecordBusinessId id={row.business_id ?? row.premises_id} />
                          {row.district_en?.trim() ? (
                            <>
                              <span aria-hidden>·</span>
                              <span>{row.district_en}</span>
                            </>
                          ) : null}
                        </div>
                        {subtype !== "—" ? <MobileCardMeta>{subtype}</MobileCardMeta> : null}
                        {area !== "—" ? <MobileCardMeta>{area}</MobileCardMeta> : null}
                        <div className="mt-1.5">
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
                        </div>
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
