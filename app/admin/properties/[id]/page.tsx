import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { PropertyV1DetailClient } from "@/components/admin/properties-v1/PropertyV1DetailClient";
import { getPropertyV1, listPropertyV1SelectOptions } from "@/lib/repos/propertiesV1";
import { listPremisesForPropertyV1 } from "@/lib/repos/premisesV1";
import { listCompanyV1Options } from "@/lib/repos/companiesV1";
import { listContactV1Options } from "@/lib/repos/contactsV1";
import { getPremisesDrawerData } from "@/lib/repos/premisesDrawer";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ premises?: string; mode?: string; tab?: string }>;
};

export default async function EditPropertyPage({ params, searchParams }: Props) {
  const { id: idRaw } = await params;
  const sp = await searchParams;
  const propertyId = idRaw.trim();
  if (!propertyId) notFound();

  const [property, premises, companies, contacts, propertyOptions] = await Promise.all([
    getPropertyV1(propertyId),
    listPremisesForPropertyV1(propertyId),
    listCompanyV1Options(),
    listContactV1Options(),
    listPropertyV1SelectOptions(),
  ]);
  if (!property) notFound();

  const premisesId = sp.premises?.trim();
  let premisesDrawerData: Awaited<ReturnType<typeof getPremisesDrawerData>> | null = null;
  if (premisesId) {
    try {
      premisesDrawerData = await getPremisesDrawerData(premisesId);
    } catch {
      premisesDrawerData = null;
    }
  }

  return (
    <AdminShell title="" wide module="properties" hideHeader>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
        <PropertyV1DetailClient
          property={property}
          premises={premises}
          companies={companies}
          contacts={contacts}
          propertyOptions={propertyOptions}
          premisesDrawerData={premisesDrawerData}
        />
      </Suspense>
    </AdminShell>
  );
}
