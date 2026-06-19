import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { BuildingFormFields } from "@/components/admin/BuildingFormFields";
import { EditableRecordForm } from "@/components/admin/EditableRecordForm";
import { getBuilding } from "@/lib/repos/buildings";
import { deleteBuildingAction, updateBuildingAction } from "../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditBuildingPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();

  const building = await getBuilding(id);
  if (!building) notFound();

  const update = updateBuildingAction.bind(null, id);
  const remove = deleteBuildingAction.bind(null, id);

  return (
    <AdminShell title={`Edit building #${id}`}>
      <EditableRecordForm
        formId={`building-form-${id}`}
        action={update}
        deleteAction={remove}
        className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6"
      >
        <BuildingFormFields defaults={building} />
      </EditableRecordForm>
    </AdminShell>
  );
}
