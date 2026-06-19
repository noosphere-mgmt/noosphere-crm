"use client";

import type { Company } from "@/lib/types/entities";
import { EditableRecordForm } from "@/components/admin/EditableRecordForm";
import { CompanyFormFields } from "@/components/admin/CompanyFormFields";

export function CompanyOverviewForm({
  company,
  formId,
  updateAction,
  deleteAction,
  initialEditMode = false,
}: {
  company: Company;
  formId: string;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: () => Promise<void>;
  initialEditMode?: boolean;
}) {
  return (
    <EditableRecordForm
      formId={formId}
      action={updateAction}
      deleteAction={deleteAction}
      initialEditMode={initialEditMode}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
    >
      <CompanyFormFields defaults={company} />
    </EditableRecordForm>
  );
}
