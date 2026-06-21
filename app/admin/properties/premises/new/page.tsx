import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { NewPremiseV1Client } from "@/components/admin/properties-v1/NewPremiseV1Client";
import { listCompanyV1Options } from "@/lib/repos/companiesV1";
import { listContactV1Options } from "@/lib/repos/contactsV1";
import { listPropertiesV1 } from "@/lib/repos/propertiesV1";

export const dynamic = "force-dynamic";

export default async function NewPremisePage() {
  const [properties, companies, contacts] = await Promise.all([
    listPropertiesV1(),
    listCompanyV1Options(),
    listContactV1Options(),
  ]);

  return (
    <AdminShell title="" wide module="properties" hideHeader>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
        <NewPremiseV1Client properties={properties} companies={companies} contacts={contacts} />
      </Suspense>
    </AdminShell>
  );
}
