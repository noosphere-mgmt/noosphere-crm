"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInlineEdit } from "@/components/admin/inline/InlineEditProvider";
import {
  displayOrDash,
  inlineFieldShellClass,
  inlineInputClass,
  inlineReadOnlyClass,
  inlineSelectClass,
  inlineViewFieldClass,
} from "@/components/admin/inline/InlineRecordChrome";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";

type SaveFn = (value: unknown) => Promise<{ ok: boolean; error?: string }>;

function useGatedInlineEdit() {
  const { editHighlight, runSave } = useInlineEdit();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editHighlight) setEditing(false);
  }, [editHighlight]);

  const beginEdit = useCallback(() => {
    if (editHighlight) setEditing(true);
  }, [editHighlight]);

  return { editHighlight, runSave, editing, setEditing, beginEdit };
}

function editableFieldProps(editHighlight: boolean, beginEdit: () => void) {
  if (!editHighlight) return {};
  return {
    onClick: beginEdit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        beginEdit();
      }
    },
    role: "button" as const,
    tabIndex: 0,
  };
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{children}</dt>;
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return <dd className="mt-0.5 text-sm font-normal leading-snug text-slate-900">{children}</dd>;
}

export function InlineTextField({
  label,
  value,
  onSave,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string | null;
  onSave: SaveFn;
  type?: string;
  placeholder?: string;
}) {
  const { editHighlight, runSave, editing, setEditing, beginEdit } = useGatedInlineEdit();
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function commit() {
    const trimmed = draft.trim();
    if (trimmed === (value ?? "").trim()) {
      setEditing(false);
      return;
    }
    const ok = await runSave(() => onSave(trimmed || null));
    if (ok) setEditing(false);
  }

  if (editing) {
    return (
      <div className={inlineFieldShellClass(editHighlight, true)}>
        <FieldLabel>{label}</FieldLabel>
        <input
          ref={inputRef}
          type={type}
          value={draft}
          placeholder={placeholder}
          className={inlineInputClass}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void commit();
            }
            if (e.key === "Escape") {
              setDraft(value ?? "");
              setEditing(false);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={inlineFieldShellClass(editHighlight, false)}
      {...editableFieldProps(editHighlight, beginEdit)}
    >
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>{displayOrDash(value)}</FieldValue>
    </div>
  );
}

function whatsAppHref(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}

export function InlinePhoneField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string | null;
  onSave: SaveFn;
}) {
  const { editHighlight, runSave, editing, setEditing, beginEdit } = useGatedInlineEdit();
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function commit() {
    const trimmed = draft.trim();
    if (trimmed === (value ?? "").trim()) {
      setEditing(false);
      return;
    }
    const ok = await runSave(() => onSave(trimmed || null));
    if (ok) setEditing(false);
  }

  if (editing) {
    return (
      <div className={inlineFieldShellClass(editHighlight, true)}>
        <FieldLabel>{label}</FieldLabel>
        <input
          ref={inputRef}
          type="tel"
          value={draft}
          className={inlineInputClass}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void commit();
            }
            if (e.key === "Escape") {
              setDraft(value ?? "");
              setEditing(false);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={inlineFieldShellClass(editHighlight, false)}
      {...editableFieldProps(editHighlight, beginEdit)}
    >
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>
        {value?.trim() ? (
          <a
            href={`tel:${value.trim()}`}
            onClick={(e) => e.stopPropagation()}
            className={connectionsGlassClasses.link}
          >
            {value}
          </a>
        ) : (
          displayOrDash(value)
        )}
      </FieldValue>
    </div>
  );
}

export function InlineEmailLinkField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string | null;
  onSave: SaveFn;
}) {
  const { editHighlight, runSave, editing, setEditing, beginEdit } = useGatedInlineEdit();
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function commit() {
    const trimmed = draft.trim();
    if (trimmed === (value ?? "").trim()) {
      setEditing(false);
      return;
    }
    const ok = await runSave(() => onSave(trimmed || null));
    if (ok) setEditing(false);
  }

  if (editing) {
    return (
      <div className={inlineFieldShellClass(editHighlight, true)}>
        <FieldLabel>{label}</FieldLabel>
        <input
          ref={inputRef}
          type="email"
          value={draft}
          className={inlineInputClass}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void commit();
            }
            if (e.key === "Escape") {
              setDraft(value ?? "");
              setEditing(false);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={inlineFieldShellClass(editHighlight, false)}
      {...editableFieldProps(editHighlight, beginEdit)}
    >
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>
        {value?.trim() ? (
          <a
            href={`mailto:${value.trim()}`}
            onClick={(e) => e.stopPropagation()}
            className={connectionsGlassClasses.link}
          >
            {value}
          </a>
        ) : (
          displayOrDash(value)
        )}
      </FieldValue>
    </div>
  );
}

export function InlineWhatsAppField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string | null;
  onSave: SaveFn;
}) {
  const { editHighlight, runSave, editing, setEditing, beginEdit } = useGatedInlineEdit();
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function commit() {
    const trimmed = draft.trim();
    if (trimmed === (value ?? "").trim()) {
      setEditing(false);
      return;
    }
    const ok = await runSave(() => onSave(trimmed || null));
    if (ok) setEditing(false);
  }

  if (editing) {
    return (
      <div className={inlineFieldShellClass(editHighlight, true)}>
        <FieldLabel>{label}</FieldLabel>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          className={inlineInputClass}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void commit();
            }
            if (e.key === "Escape") {
              setDraft(value ?? "");
              setEditing(false);
            }
          }}
        />
      </div>
    );
  }

  const href = value?.trim() ? whatsAppHref(value) : null;

  return (
    <div
      className={inlineFieldShellClass(editHighlight, false)}
      {...editableFieldProps(editHighlight, beginEdit)}
    >
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={connectionsGlassClasses.link}
          >
            {value}
          </a>
        ) : (
          displayOrDash(value)
        )}
      </FieldValue>
    </div>
  );
}

export function InlineTextAreaField({
  label,
  value,
  onSave,
  compact = false,
}: {
  label: string;
  value: string | null;
  onSave: SaveFn;
  compact?: boolean;
}) {
  const { editHighlight, runSave, editing, setEditing, beginEdit } = useGatedInlineEdit();
  const [draft, setDraft] = useState(value ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  async function commit() {
    const trimmed = draft.trim();
    if (trimmed === (value ?? "").trim()) {
      setEditing(false);
      return;
    }
    const ok = await runSave(() => onSave(trimmed || null));
    if (ok) setEditing(false);
  }

  if (editing) {
    return (
      <div className={`${inlineFieldShellClass(editHighlight, true)} sm:col-span-2`}>
        <FieldLabel>{label}</FieldLabel>
        <textarea
          ref={ref}
          rows={compact ? 2 : 4}
          value={draft}
          className={inlineInputClass}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(value ?? "");
              setEditing(false);
            }
          }}
        />
      </div>
    );
  }

  const display = value?.trim() ? value : null;

  return (
    <div
      className={`${inlineFieldShellClass(editHighlight, false)} sm:col-span-2`}
      {...editableFieldProps(editHighlight, beginEdit)}
    >
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>
        {display ? (
          <span className={`whitespace-pre-wrap ${compact ? "line-clamp-2" : ""}`}>{display}</span>
        ) : (
          displayOrDash(value)
        )}
      </FieldValue>
    </div>
  );
}

export function InlineSelectField({
  label,
  value,
  options,
  onSave,
  placeholder = "—",
}: {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onSave: SaveFn;
  placeholder?: string;
}) {
  const { editHighlight, runSave, editing, setEditing, beginEdit } = useGatedInlineEdit();
  const ref = useRef<HTMLSelectElement>(null);

  const display =
    options.find((o) => o.value === (value ?? ""))?.label ?? displayOrDash(value);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  async function commit(next: string) {
    const normalized = next || null;
    if ((normalized ?? "") === (value ?? "")) {
      setEditing(false);
      return;
    }
    const ok = await runSave(() => onSave(normalized));
    if (ok) setEditing(false);
  }

  if (editing) {
    return (
      <div className={inlineFieldShellClass(editHighlight, true)}>
        <FieldLabel>{label}</FieldLabel>
        <select
          ref={ref}
          className={inlineSelectClass}
          defaultValue={value ?? ""}
          onChange={(e) => void commit(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
          }}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div
      className={inlineFieldShellClass(editHighlight, false)}
      {...editableFieldProps(editHighlight, beginEdit)}
    >
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>{display}</FieldValue>
    </div>
  );
}

export function InlineDateField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string | null;
  onSave: SaveFn;
}) {
  const display = value?.slice(0, 10) ?? null;
  return (
    <InlineTextField
      label={label}
      value={display}
      type="date"
      onSave={async (v) => onSave(v)}
    />
  );
}

export function InlineReadOnlyField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | null;
  hint?: string;
}) {
  return (
    <div className={inlineReadOnlyClass()}>
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>{displayOrDash(value)}</FieldValue>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function InlineBooleanField({
  label,
  value,
  onSave,
  trueLabel = "Yes",
  falseLabel = "No",
}: {
  label: string;
  value: boolean;
  onSave: SaveFn;
  trueLabel?: string;
  falseLabel?: string;
}) {
  const { editHighlight, runSave } = useInlineEdit();

  async function toggle() {
    if (!editHighlight) return;
    await runSave(() => onSave(!value));
  }

  return (
    <div
      className={inlineFieldShellClass(editHighlight, false)}
      {...editableFieldProps(editHighlight, () => void toggle())}
    >
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>{value ? trueLabel : falseLabel}</FieldValue>
    </div>
  );
}

export function InlineMultiSelectField({
  label,
  values,
  options,
  onSave,
  optionLabel,
  colSpan = 2,
  allowSelectAll = false,
}: {
  label: string;
  values: string[];
  options: string[];
  onSave: SaveFn;
  optionLabel?: (value: string) => string;
  colSpan?: 1 | 2 | 3;
  allowSelectAll?: boolean;
}) {
  const { editHighlight, runSave, editing, setEditing, beginEdit } = useGatedInlineEdit();
  const [draft, setDraft] = useState(new Set(values));
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editing) setDraft(new Set(values));
  }, [values, editing]);

  useEffect(() => {
    if (!editing) return;
    function onDocClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        void commit();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  });

  async function commit() {
    const next = [...draft].sort();
    const prev = [...values].sort();
    if (next.join("|") === prev.join("|")) {
      setEditing(false);
      return;
    }
    const ok = await runSave(() => onSave(next));
    if (ok) setEditing(false);
  }

  const display =
    values.length > 0
      ? values.map((v) => optionLabel?.(v) ?? v).join(", ")
      : "—";

  const spanClass =
    colSpan === 3 ? "col-span-full" : colSpan === 2 ? "sm:col-span-2" : "";

  if (editing) {
    return (
      <div
        ref={panelRef}
        className={`${inlineViewFieldClass()} ${spanClass}`}
      >
        <FieldLabel>{label}</FieldLabel>
        {allowSelectAll ? (
          <div className="mt-1 flex items-center gap-2 text-xs">
            <button
              type="button"
              className={connectionsGlassClasses.link}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setDraft(new Set(options));
              }}
            >
              All
            </button>
            <span className="text-slate-300" aria-hidden>
              ·
            </span>
            <button
              type="button"
              className="font-medium text-slate-600 hover:text-slate-900 hover:underline"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setDraft(new Set());
              }}
            >
              Clear
            </button>
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((option) => {
            const checked = draft.has(option);
            return (
              <label
                key={option}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                  checked
                    ? "border-violet-300 bg-violet-50 text-violet-900"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => {
                    setDraft((prev) => {
                      const next = new Set(prev);
                      if (next.has(option)) next.delete(option);
                      else next.add(option);
                      return next;
                    });
                  }}
                />
                {optionLabel?.(option) ?? option}
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${inlineFieldShellClass(editHighlight, false)} ${spanClass}`}
      {...editableFieldProps(editHighlight, beginEdit)}
    >
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>{display}</FieldValue>
    </div>
  );
}

export function InlineCompanyPickerField({
  label,
  companyId,
  companyName,
  companies,
  onSave,
}: {
  label: string;
  companyId: number;
  companyName: string | null;
  companies: { id: number; company_name: string }[];
  onSave: SaveFn;
}) {
  const { editHighlight, runSave, editing, setEditing, beginEdit } = useGatedInlineEdit();
  const [query, setQuery] = useState("");
  const [draftId, setDraftId] = useState(companyId);
  const panelRef = useRef<HTMLDivElement>(null);

  const filtered = companies.filter((c) =>
    c.company_name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!editing) {
      setDraftId(companyId);
      setQuery("");
    }
  }, [companyId, editing]);

  useEffect(() => {
    if (!editing) return;
    function onDocClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        void commit(draftId);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  });

  async function commit(id: number) {
    if (id === companyId) {
      setEditing(false);
      return;
    }
    const ok = await runSave(() => onSave(id));
    if (ok) setEditing(false);
  }

  if (editing) {
    return (
      <div ref={panelRef} className={inlineViewFieldClass()}>
        <FieldLabel>{label}</FieldLabel>
        <input
          type="search"
          value={query}
          placeholder="Search companies…"
          className={inlineInputClass}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <ul className="mt-1 max-h-40 overflow-y-auto rounded border border-slate-200 bg-white text-sm shadow-sm">
          {filtered.length === 0 ? (
            <li className="px-2 py-2 text-slate-500">No matches</li>
          ) : (
            filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`block w-full px-2 py-1.5 text-left hover:bg-slate-50 ${
                    c.id === draftId ? "bg-violet-50 font-medium text-violet-900" : ""
                  }`}
                  onClick={() => {
                    setDraftId(c.id);
                    void commit(c.id);
                  }}
                >
                  {c.company_name}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    );
  }

  return (
    <div
      className={inlineFieldShellClass(editHighlight, false)}
      {...editableFieldProps(editHighlight, beginEdit)}
    >
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>{displayOrDash(companyName)}</FieldValue>
    </div>
  );
}
