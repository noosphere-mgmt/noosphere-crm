"use client";

import { FormField, TextAreaField } from "@/components/admin/AdminFormFields";
import { useFormEditing } from "@/components/admin/ModuleActionBar";
import type { Operator } from "@/lib/types/entities";

type Props = { defaults: Operator };

export function OperatorFormFields({ defaults }: Props) {
  const editing = useFormEditing();

  return (
    <>
      <FormField label="Name" name="name" defaultValue={defaults.name} required />
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={defaults.is_active}
          disabled={!editing}
          className="rounded border-slate-300"
        />
        Active
      </label>
      <TextAreaField label="Notes" name="notes" defaultValue={defaults.notes ?? ""} />
    </>
  );
}
