import { AdminShell } from "@/components/admin/AdminShell";
import { PropertyV1DetailClient } from "@/components/admin/properties-v1/PropertyV1DetailClient";
import { listCompanyV1Options } from "@/lib/repos/companiesV1";
import { listContactV1Options } from "@/lib/repos/contactsV1";
import { emptyPropertyV1 } from "@/lib/repos/propertiesV1";

export const dynamic = "force-dynamic";

export default async function NewBuildingPage() {
  const [companies, contacts] = await Promise.all([listCompanyV1Options(), listContactV1Options()]);

  return (
    <AdminShell title="" wide module="properties" hideHeader>
      <PropertyV1DetailClient
        property={emptyPropertyV1()}
        premises={[]}
        companies={companies}
        contacts={contacts}
        editMode
        returnTo="/admin/properties/buildings"
      />
    </AdminShell>
  );
}
