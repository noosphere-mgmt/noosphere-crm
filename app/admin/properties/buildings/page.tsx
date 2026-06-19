import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AllBuildingsWorkspace } from "@/components/admin/properties-v1/AllBuildingsWorkspace";
import { listCompanyV1Options } from "@/lib/repos/companiesV1";
import { listContactV1Options } from "@/lib/repos/contactsV1";
import { listPremisesForPropertyV1 } from "@/lib/repos/premisesV1";
import { getPropertyV1, listPropertiesV1, listPropertyV1SelectOptions, countPropertiesV1 } from "@/lib/repos/propertiesV1";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; property?: string; mode?: string }>;
};

export default async function AllPropertiesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const propertyId = sp.property?.trim() || undefined;

  const [rows, propertyOptions, companies, contacts, totalCount] = await Promise.all([
    listPropertiesV1({ q }),
    listPropertyV1SelectOptions(),
    listCompanyV1Options(),
    listContactV1Options(),
    countPropertiesV1(),
  ]);

  const [selectedProperty, selectedPremises] = propertyId
    ? await Promise.all([getPropertyV1(propertyId), listPremisesForPropertyV1(propertyId)])
    : [null, []];

  return (
    <AdminShell title="Properties" module="properties" wide hideHeader>
      <AllBuildingsWorkspace
        rows={rows}
        totalCount={totalCount}
        initialQuery={q}
        selectedProperty={selectedProperty}
        selectedPremises={selectedPremises}
        propertyOptions={propertyOptions}
        companies={companies}
        contacts={contacts}
      />
    </AdminShell>
  );
}
