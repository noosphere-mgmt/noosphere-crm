import { AdminShell } from "@/components/admin/AdminShell";
import { BuildingFormFields } from "@/components/admin/BuildingFormFields";
import { CancelLink, SubmitButton } from "@/components/admin/AdminFormFields";
import { createBuildingAction } from "../actions";

export default function NewBuildingPage() {
  return (
    <AdminShell title="New building">
      <form action={createBuildingAction} className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <BuildingFormFields />
        <div className="flex items-center gap-4 pt-2">
          <SubmitButton label="Create building" />
          <CancelLink href="/admin/buildings" />
        </div>
      </form>
    </AdminShell>
  );
}
