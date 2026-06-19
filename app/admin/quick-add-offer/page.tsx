import { AdminShell } from "@/components/admin/AdminShell";
import { QuickAddPropertyForm } from "@/components/admin/QuickAddInventoryForm";
import { listCompanyOptionsByRole } from "@/lib/repos/companies";
import { listBuildings } from "@/lib/repos/buildings";
import { listMarketableProperties } from "@/lib/repos/marketableProperties";
import { quickAddPropertyAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function QuickAddPropertyPage() {
  const [buildings, properties, operatorCompanies] = await Promise.all([
    listBuildings(),
    listMarketableProperties(),
    listCompanyOptionsByRole("operator"),
  ]);

  return (
    <AdminShell title="Quick add property">
      <p className="mb-6 max-w-3xl text-sm text-slate-600">
        Add a marketable property in one step: building → space → operator → listing terms.
      </p>
      <QuickAddPropertyForm
        buildings={buildings}
        properties={properties}
        operatorCompanies={operatorCompanies}
        action={quickAddPropertyAction}
      />
    </AdminShell>
  );
}
