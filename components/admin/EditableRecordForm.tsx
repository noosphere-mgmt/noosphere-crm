"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormEditingContext, ModuleActionBar } from "@/components/admin/ModuleActionBar";

export function EditableRecordForm({
  formId,
  action,
  deleteAction,
  children,
  className,
  header,
  initialEditMode = false,
}: {
  formId: string;
  action: (formData: FormData) => Promise<void>;
  deleteAction?: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  initialEditMode?: boolean;
}) {
  const [editMode, setEditMode] = useState(initialEditMode);
  const router = useRouter();

  function handleCancel() {
    setEditMode(false);
    router.refresh();
  }

  return (
    <FormEditingContext.Provider value={editMode}>
      <form id={formId} action={action} className={className}>
        <div className="mb-4 flex items-start justify-between gap-4">
          {header ? <div className="min-w-0 flex-1">{header}</div> : null}
          <ModuleActionBar
            mode={editMode ? "edit" : "view"}
            onEdit={() => setEditMode(true)}
            onCancel={handleCancel}
            formId={formId}
            deleteAction={deleteAction}
          />
        </div>
        {children}
      </form>
    </FormEditingContext.Provider>
  );
}
