import { AdminShell } from "@/components/admin/AdminShell";
import { PropertyV1DetailClient } from "@/components/admin/properties-v1/PropertyV1DetailClient";
import { loadPropertyFormOptions } from "@/lib/loadPropertyFormOptions";
import { emptyPropertyV1 } from "@/lib/repos/propertiesV1";

export const dynamic = "force-dynamic";

export default async function NewBuildingPage() {
  const { companies, contacts, warnings } = await loadPropertyFormOptions();

  return (
    <AdminShell title="" wide module="properties" hideHeader>
      <PropertyV1DetailClient
        property={emptyPropertyV1()}
        premises={[]}
        companies={companies}
        contacts={contacts}
        loadWarnings={warnings}
        returnTo="/admin/properties/buildings"
      />
    </AdminShell>
  );
}
