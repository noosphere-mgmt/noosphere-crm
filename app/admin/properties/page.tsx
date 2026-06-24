import { AdminShell } from "@/components/admin/AdminShell";
import { AllPremisesWorkspace } from "@/components/admin/properties-v1/AllPremisesWorkspace";
import { listCompanyV1Options } from "@/lib/repos/companiesV1";
import { listContactV1Options } from "@/lib/repos/contactsV1";
import {
  countPremisesV1,
  getPremisesListItemByRef,
  listPremisesFilterOptions,
  listPremisesFullFiltered,
  resolvePremisesV1Id,
  type PremisesFlatFilters,
} from "@/lib/repos/premisesV1";
import { listPropertyV1SelectOptions } from "@/lib/repos/propertiesV1";
import { getPremisesDrawerData } from "@/lib/repos/premisesDrawer";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    city?: string;
    district?: string;
    property_type?: string;
    operating_model?: string;
    fit_out_condition?: string;
    listing_intent?: string;
    listing_status?: string;
    premises?: string;
    mode?: string;
    tab?: string;
  }>;
};

export default async function AllPremisesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filters: PremisesFlatFilters = {
    q: sp.q?.trim() || undefined,
    city: sp.city?.trim() || undefined,
    district: sp.district?.trim() || undefined,
    property_type: sp.property_type?.trim() || undefined,
    operating_model: sp.operating_model?.trim() || undefined,
    fit_out_condition: sp.fit_out_condition?.trim() || undefined,
    listing_intent: sp.listing_intent?.trim() || undefined,
    listing_status: sp.listing_status?.trim() || undefined,
  };

  const premisesRef = sp.premises?.trim();

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
      />
    </AdminShell>
  );
}
