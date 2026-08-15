import { AdminShell } from "@/components/admin/AdminShell";
import { AllPremisesWorkspace } from "@/components/admin/properties-v1/AllPremisesWorkspace";
import { listCompanyV1Options } from "@/lib/repos/companiesV1";
import { listContactV1Options } from "@/lib/repos/contactsV1";
import {
  countPremisesV1,
  getPremisesListItemByRef,
  listPremisesFilterOptions,
  listPremisesForPropertyV1,
  listPremisesFullFiltered,
  resolvePremisesV1Id,
  type PremisesFlatFilters,
} from "@/lib/repos/premisesV1";
import { getPropertyV1, listPropertyV1SelectOptions } from "@/lib/repos/propertiesV1";
import { getPremisesDrawerData } from "@/lib/repos/premisesDrawer";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    city?: string;
    district?: string;
    title?: string;
    building_type?: string;
    asset_class?: string;
    product_subtype?: string;
    property_category?: string;
    property_type?: string;
    operating_model?: string;
    fit_out_condition?: string;
    view_type?: string;
    listing_intent?: string;
    listing_status?: string;
    centre_status?: string;
    operator?: string;
    offers_unique_address?: string;
    offers_stamp_duty?: string;
    package_offers?: string;
    monthly_rent_max?: string;
    premises?: string;
    mode?: string;
    tab?: string;
    building?: string;
    building_mode?: string;
  }>;
};

export default async function AllPremisesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filters: PremisesFlatFilters = {
    q: sp.q?.trim() || undefined,
    city: sp.city?.trim() || undefined,
    district: sp.district?.trim() || undefined,
    title: sp.title?.trim() || undefined,
    asset_class: sp.asset_class?.trim() || undefined,
    product_subtype: sp.product_subtype?.trim() || undefined,
    fit_out_condition: sp.fit_out_condition?.trim() || undefined,
    view_type: sp.view_type?.trim() || undefined,
    listing_intent: sp.listing_intent?.trim() || undefined,
    listing_status: sp.listing_status?.trim() || undefined,
    centre_status: sp.centre_status?.trim() || undefined,
    operator: sp.operator?.trim() || undefined,
    offers_unique_address: sp.offers_unique_address?.trim() || undefined,
    offers_stamp_duty: sp.offers_stamp_duty?.trim() || undefined,
    package_offers: sp.package_offers?.trim() || undefined,
    monthly_rent_max: sp.monthly_rent_max?.trim() || undefined,
  };

  const premisesRef = sp.premises?.trim();
  const buildingRef = sp.building?.trim();

  const [rowsRaw, options, companies, contacts, propertyOptions, totalCount, drawerData] = await Promise.all([
    listPremisesFullFiltered(filters),
    listPremisesFilterOptions(),
    listCompanyV1Options(),
    listContactV1Options(),
    listPropertyV1SelectOptions(),
    countPremisesV1(),
    premisesRef
      ? getPremisesDrawerData(premisesRef).catch(() => null)
      : Promise.resolve(null as Awaited<ReturnType<typeof getPremisesDrawerData>> | null),
  ]);

  let rows = rowsRaw;
  if (premisesRef) {
    const canonicalId = await resolvePremisesV1Id(premisesRef);
    const inList = rows.some(
      (r) => r.premises_id === premisesRef || (canonicalId != null && r.premises_id === canonicalId),
    );
    if (!inList) {
      const extra = await getPremisesListItemByRef(premisesRef);
      if (extra) rows = [extra, ...rows];
    }
  }

  const [selectedBuildingProperty, selectedBuildingPremises] = buildingRef
    ? await Promise.all([getPropertyV1(buildingRef), listPremisesForPropertyV1(buildingRef)])
    : [null, []];

  return (
    <AdminShell title="Properties" module="properties" wide hideHeader>
      <AllPremisesWorkspace
        rows={rows}
        totalCount={totalCount}
        filters={filters}
        cities={options.cities}
        districts={options.districts}
        companies={companies}
        contacts={contacts}
        propertyOptions={propertyOptions}
        drawerData={drawerData}
        selectedBuildingProperty={selectedBuildingProperty}
        selectedBuildingPremises={selectedBuildingPremises}
      />
    </AdminShell>
  );
}
