import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { PremisesWorkspacePageClient } from "@/components/admin/properties-v1/PremisesWorkspacePageClient";
import { listCompanyV1Options } from "@/lib/repos/companiesV1";
import { listContactV1Options } from "@/lib/repos/contactsV1";
import { getPremisesDrawerData } from "@/lib/repos/premisesDrawer";
import { resolvePremisesV1Id, getPremisesV1, listPremisesForPropertyV1 } from "@/lib/repos/premisesV1";
import { getPropertyV1, listPropertyV1SelectOptions } from "@/lib/repos/propertiesV1";
import { sanitizeAdminReturnTo } from "@/lib/adminReturnTo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string; tab?: string; returnTo?: string }>;
};

export default async function PremisesDetailPage({ params, searchParams }: Props) {
  const { id: idRaw } = await params;
  const sp = await searchParams;
  const returnTo = sanitizeAdminReturnTo(sp.returnTo, "/admin/properties");
  const premisesId = (await resolvePremisesV1Id(idRaw.trim())) ?? idRaw.trim();
  const premises = await getPremisesV1(premisesId);
  if (!premises) notFound();

  const [drawerData, companies, contacts, propertyOptions, building, buildingPremises] = await Promise.all([
    getPremisesDrawerData(premises.premises_id, true).catch(() => null),
    listCompanyV1Options(),
    listContactV1Options(),
    listPropertyV1SelectOptions(),
    premises.property_id ? getPropertyV1(premises.property_id).catch(() => null) : Promise.resolve(null),
    premises.property_id ? listPremisesForPropertyV1(premises.property_id).catch(() => [premises]) : Promise.resolve([premises]),
  ]);

  return (
    <AdminShell title="" wide module="properties" hideHeader>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
        <PremisesWorkspacePageClient
          premises={premises}
          building={building}
          buildingPremises={buildingPremises}
          drawerData={drawerData}
          companies={companies}
          contacts={contacts}
          propertyOptions={propertyOptions}
          editMode={sp.mode === "edit"}
          returnTo={returnTo}
        />
      </Suspense>
    </AdminShell>
  );
}
