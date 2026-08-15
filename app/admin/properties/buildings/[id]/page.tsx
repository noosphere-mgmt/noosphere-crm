import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { BuildingWorkspacePageClient } from "@/components/admin/properties-v1/BuildingWorkspacePageClient";
import { listActivitiesForPremises } from "@/lib/repos/activities";
import { listCompanyV1Options } from "@/lib/repos/companiesV1";
import { listContactV1Options } from "@/lib/repos/contactsV1";
import { listPremisesForPropertyV1 } from "@/lib/repos/premisesV1";
import { getPropertyV1, listPropertyV1SelectOptions } from "@/lib/repos/propertiesV1";
import type { ActivityListRow } from "@/lib/repos/activities";
import { sanitizeAdminReturnTo } from "@/lib/adminReturnTo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string; tab?: string; premises?: string; returnTo?: string }>;
};

async function listBuildingActivities(premisesIds: string[]): Promise<ActivityListRow[]> {
  if (premisesIds.length === 0) return [];
  const batches = await Promise.all(
    premisesIds.map((id) => listActivitiesForPremises(id).catch(() => [] as ActivityListRow[])),
  );
  const byId = new Map<number, ActivityListRow>();
  for (const batch of batches) {
    for (const row of batch) {
      byId.set(row.id, row);
    }
  }
  return [...byId.values()].sort((a, b) => {
    const dateCmp = b.activity_date.localeCompare(a.activity_date);
    if (dateCmp !== 0) return dateCmp;
    return b.id - a.id;
  });
}

export default async function BuildingDetailPage({ params, searchParams }: Props) {
  const { id: idRaw } = await params;
  const sp = await searchParams;
  const returnTo = sanitizeAdminReturnTo(sp.returnTo, "/admin/properties");
  const property = await getPropertyV1(idRaw.trim());
  if (!property) notFound();

  const [premises, companies, contacts, propertyOptions] = await Promise.all([
    listPremisesForPropertyV1(property.property_id),
    listCompanyV1Options(),
    listContactV1Options(),
    listPropertyV1SelectOptions(),
  ]);

  const activities = await listBuildingActivities(premises.map((p) => p.premises_id));

  return (
    <AdminShell title="" wide module="properties" hideHeader>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
        <BuildingWorkspacePageClient
          property={property}
          premises={premises}
          companies={companies}
          contacts={contacts}
          propertyOptions={propertyOptions}
          activities={activities}
          editMode={sp.mode === "edit"}
          returnTo={returnTo}
        />
      </Suspense>
    </AdminShell>
  );
}
