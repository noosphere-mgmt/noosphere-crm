import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { EditableRecordForm } from "@/components/admin/EditableRecordForm";
import { OperatorFormFields } from "@/components/admin/OperatorFormFields";
import { getOperator } from "@/lib/repos/operators";
import { deleteOperatorAction, updateOperatorAction } from "../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditOperatorPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id)) notFound();

  const operator = await getOperator(id);
  if (!operator) notFound();

  const update = updateOperatorAction.bind(null, id);
  const remove = deleteOperatorAction.bind(null, id);

  return (
    <AdminShell title={`Legacy operator #${id}`}>
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Deprecated legacy operator record. Use{" "}
        <Link href="/admin/companies?role=operator" className="font-medium underline">
          Companies with role Operator
        </Link>{" "}
        and link spaces via <code className="rounded bg-white px-1">operator_company_id</code>. This form remains
        only for existing offer links on <code className="rounded bg-white px-1">inventory.operator_id</code>.
      </div>
      <EditableRecordForm
        formId={`operator-form-${id}`}
        action={update}
        deleteAction={remove}
        className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6"
      >
        <OperatorFormFields defaults={operator} />
      </EditableRecordForm>
    </AdminShell>
  );
}
