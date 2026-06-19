"use client";

import Link from "next/link";
import { useFormEditing, moduleActionButtonClass } from "@/components/admin/ModuleActionBar";
import { IconCheck, IconTrash, IconX } from "@/components/admin/ModuleActionIcons";
import { displayOrDash, inlineReadOnlyClass } from "@/components/admin/inline/InlineRecordChrome";

const inputClass =
  "mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 shadow-sm";

const viewLabelClass = "text-xs font-medium uppercase tracking-wide text-slate-500";
const viewValueClass = "mt-0.5 text-sm font-normal leading-snug text-slate-900";

function ViewField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className={inlineReadOnlyClass()}>
      <dt className={viewLabelClass}>{label}</dt>
      <dd className={viewValueClass}>{displayOrDash(value)}</dd>
    </div>
  );
}

export function FormField({
  label,
  name,
  defaultValue,
  value,
  onChange,
  required,
  type = "text",
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  disabled?: boolean;
}) {
  const editing = useFormEditing();
  const isDisabled = disabled ?? !editing;
  const controlled = value !== undefined;
  const displayValue = controlled ? value : defaultValue;

  if (isDisabled) {
    return (
      <div>
        <ViewField label={label} value={displayValue} />
        <input type="hidden" name={name} value={displayValue ?? ""} />
      </div>
    );
  }

  return (
    <label className="block">
      <span className={viewLabelClass}>{label}</span>
      <input
        type={type}
        name={name}
        {...(controlled ? { value, onChange } : { defaultValue })}
        required={required}
        className={inputClass}
      />
    </label>
  );
}

export function TextAreaField({
  label,
  name,
  defaultValue,
  rows = 3,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  disabled?: boolean;
}) {
  const editing = useFormEditing();
  const isDisabled = disabled ?? !editing;

  if (isDisabled) {
    return (
      <div>
        <ViewField label={label} value={defaultValue} />
        <input type="hidden" name={name} value={defaultValue ?? ""} />
      </div>
    );
  }

  return (
    <label className="block">
      <span className={viewLabelClass}>{label}</span>
      <textarea name={name} defaultValue={defaultValue} rows={rows} className={inputClass} />
    </label>
  );
}

export function SelectField({
  label,
  name,
  defaultValue,
  options,
  placeholder = "— Select —",
  disabled,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  options: readonly string[] | { value: string; label: string }[];
}) {
  const editing = useFormEditing();
  const isDisabled = disabled ?? !editing;
  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  const selected = defaultValue ?? "";
  const displayLabel =
    normalized.find((o) => o.value === selected)?.label ?? (selected || null);

  if (isDisabled) {
    return (
      <div>
        <ViewField label={label} value={displayLabel} />
        <input type="hidden" name={name} value={selected} />
      </div>
    );
  }

  return (
    <label className="block">
      <span className={viewLabelClass}>{label}</span>
      <select name={name} defaultValue={selected} required={required} className={inputClass}>
        <option value="">{placeholder}</option>
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SubmitButton({ label }: { label: string }) {
  return (
    <button type="submit" className={moduleActionButtonClass.save} aria-label={label} title={label}>
      <IconCheck />
    </button>
  );
}

export function CancelLink({ href }: { href: string }) {
  return (
    <Link href={href} className={moduleActionButtonClass.cancel} aria-label="Cancel" title="Cancel">
      <IconX />
    </Link>
  );
}

export function DeleteButton({
  action,
  label = "Delete",
}: {
  action: () => Promise<void>;
  label?: string;
}) {
  return (
    <form action={action}>
      <button type="submit" className={moduleActionButtonClass.delete} aria-label={label} title={label}>
        <IconTrash />
      </button>
    </form>
  );
}
