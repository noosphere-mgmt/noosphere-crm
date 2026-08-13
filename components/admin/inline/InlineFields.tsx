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
import { formatLabelWithBusinessId } from "@/lib/crmSelectOptions";
import {
  DEFAULT_PHONE_AREA_CODE,
  PHONE_AREA_CODES,
  formatPhoneDisplay,
  normalizePhoneAreaCode,
  telHref,
  whatsAppHrefFromParts,
} from "@/lib/phoneAreaCodes";

type SaveFn = (value: unknown) => Promise<{ ok: boolean; error?: string }>;

function useGatedInlineEdit() {
  const { runSave } = useInlineEdit();
  const [editing, setEditing] = useState(false);

  /** Always allow click-to-edit in view/drawer; pen opens full-page edit. */
  const editHighlight = true;

  const beginEdit = useCallback(() => {
    setEditing(true);
  }, []);

  return { editHighlight, runSave, editing, setEditing, beginEdit };
}

function editableFieldProps(_editHighlight: boolean, beginEdit: () => void) {
  return {
    onDoubleClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      beginEdit();
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        beginEdit();
      }
    },
    role: "button" as const,
    tabIndex: 0,
    title: "Double-click to edit · saves automatically",
    "aria-label": "Double-click to edit",
  };
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <dt className="whitespace-nowrap text-xs font-medium uppercase tracking-wide text-slate-500">
      {children}
    </dt>
  );
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return <dd className="mt-0.5 min-h-5 text-sm font-normal leading-snug text-slate-900">{children}</dd>;
}

function formatInlineNumber(value: string | null): string {
  const raw = value?.trim();
  if (!raw) return "";
  const number = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(number)) return raw;
  const decimalPlaces = raw.includes(".") ? Math.min(raw.split(".")[1]?.length ?? 0, 6) : 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(number);
}

export function InlineTextField({
  label,
  value,
  onSave,
  type = "text",
  placeholder,
  hideLabel = false,
  useGrouping = true,
}: {
  label: string;
  value: string | null;
  onSave: SaveFn;
  type?: string;
  placeholder?: string;
  hideLabel?: boolean;
  useGrouping?: boolean;
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
        {!hideLabel ? <FieldLabel>{label}</FieldLabel> : null}
        <input
          ref={inputRef}
          type={type}
          step={type === "number" ? "0.01" : undefined}
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
      {!hideLabel ? <FieldLabel>{label}</FieldLabel> : null}
      <FieldValue>{type === "number" && useGrouping ? formatInlineNumber(value) : displayOrDash(value)}</FieldValue>
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

/** Phone / Mobile / WhatsApp with dialing area code. */
export function InlineTelWithAreaField({
  label,
  areaCode,
  number,
  onSaveAreaCode,
  onSaveNumber,
  link = "tel",
}: {
  label: string;
  areaCode: string | null | undefined;
  number: string | null | undefined;
  onSaveAreaCode: SaveFn;
  onSaveNumber: SaveFn;
  link?: "tel" | "whatsapp";
}) {
  const { editHighlight, runSave, editing, setEditing, beginEdit } = useGatedInlineEdit();
  const [draftArea, setDraftArea] = useState(areaCode ?? DEFAULT_PHONE_AREA_CODE);
  const [draftNumber, setDraftNumber] = useState(number ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraftArea(areaCode?.trim() || DEFAULT_PHONE_AREA_CODE);
      setDraftNumber(number ?? "");
    }
  }, [areaCode, number, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function commit() {
    const nextArea = normalizePhoneAreaCode(draftArea);
    const nextNumber = draftNumber.trim() || null;
    const prevArea = normalizePhoneAreaCode(areaCode);
    const prevNumber = (number ?? "").trim() || null;
    if (nextArea === prevArea && nextNumber === prevNumber) {
      setEditing(false);
      return;
    }
    const ok = await runSave(async () => {
      if (nextArea !== prevArea) {
        const areaResult = await onSaveAreaCode(nextArea);
        if (!areaResult.ok) return areaResult;
      }
      if (nextNumber !== prevNumber) {
        return onSaveNumber(nextNumber);
      }
      return { ok: true };
    });
    if (ok) setEditing(false);
  }

  const display = formatPhoneDisplay(areaCode, number);
  const href =
    link === "whatsapp"
      ? whatsAppHrefFromParts(areaCode, number)
      : telHref(areaCode, number);

  if (editing) {
    return (
      <div className={inlineFieldShellClass(editHighlight, true)}>
        <FieldLabel>{label}</FieldLabel>
        <div className="flex min-w-0 items-center gap-1.5">
          <select
            value={draftArea}
            onChange={(e) => setDraftArea(e.target.value)}
            className={`${inlineSelectClass} w-[7.5rem] shrink-0`}
            aria-label={`${label} area code`}
          >
            {PHONE_AREA_CODES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value}
              </option>
            ))}
          </select>
          <input
            ref={inputRef}
            type="tel"
            value={draftNumber}
            className={`${inlineInputClass} min-w-0 flex-1`}
            onChange={(e) => setDraftNumber(e.target.value)}
            onBlur={() => void commit()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void commit();
              }
              if (e.key === "Escape") {
                setDraftArea(areaCode?.trim() || DEFAULT_PHONE_AREA_CODE);
                setDraftNumber(number ?? "");
                setEditing(false);
              }
            }}
          />
        </div>
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
        {display && href ? (
          <a
            href={href}
            {...(link === "whatsapp"
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            onClick={(e) => e.stopPropagation()}
            className={connectionsGlassClasses.link}
          >
            {display}
          </a>
        ) : (
          displayOrDash(display)
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
  fullWidth = false,
  singleColumn = false,
  hideLabel = false,
}: {
  label: string;
  value: string | null;
  onSave: SaveFn;
  compact?: boolean;
  /** Span all columns in a multi-column overview grid. */
  fullWidth?: boolean;
  /** Stay within one grid column instead of using the default two-column span. */
  singleColumn?: boolean;
  hideLabel?: boolean;
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

  const spanClass = fullWidth ? "col-span-full" : singleColumn ? "" : "sm:col-span-2";

  if (editing) {
    return (
      <div className={`${inlineFieldShellClass(editHighlight, true)} ${spanClass}`}>
        {!hideLabel ? <FieldLabel>{label}</FieldLabel> : null}
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
      className={`${inlineFieldShellClass(editHighlight, false)} ${spanClass}`}
      {...editableFieldProps(editHighlight, beginEdit)}
    >
      {!hideLabel ? <FieldLabel>{label}</FieldLabel> : null}
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
  placeholder = "Select…",
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
  const { runSave } = useInlineEdit();

  async function toggle() {
    await runSave(() => onSave(!value));
  }

  return (
    <div
      className={inlineFieldShellClass(true, false)}
      {...editableFieldProps(true, () => void toggle())}
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
      : "";

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
  companyId: number | null;
  companyName: string | null;
  companies: { id: number; company_name: string; business_id?: string | null }[];
  onSave: SaveFn;
}) {
  const { editHighlight, runSave, editing, setEditing, beginEdit } = useGatedInlineEdit();
  const [query, setQuery] = useState("");
  const currentBusinessId =
    companies.find((c) => c.id === companyId)?.business_id?.trim() ?? "";
  const [draftBusinessId, setDraftBusinessId] = useState(currentBusinessId);
  const panelRef = useRef<HTMLDivElement>(null);

  const filtered = companies.filter(
    (c) =>
      c.business_id &&
      c.company_name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const companyLabel = (c: { company_name: string; business_id?: string | null }) =>
    formatLabelWithBusinessId(c.company_name, c.business_id);

  useEffect(() => {
    if (!editing) {
      setDraftBusinessId(currentBusinessId);
      setQuery("");
    }
  }, [companyId, currentBusinessId, editing]);

  useEffect(() => {
    if (!editing) return;
    function onDocClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        void commit(draftBusinessId);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  });

  async function commit(businessId: string) {
    if (businessId === currentBusinessId) {
      setEditing(false);
      return;
    }
    const ok = await runSave(() => onSave(businessId || null));
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
          <li>
            <button
              type="button"
              className={`block w-full px-2 py-1.5 text-left hover:bg-slate-50 ${
                !draftBusinessId ? "bg-violet-50 font-medium text-violet-900" : ""
              }`}
              onClick={() => {
                setDraftBusinessId("");
                void commit("");
              }}
            >
              No Company
            </button>
          </li>
          {filtered.length === 0 ? (
            <li className="px-2 py-2 text-slate-500">No matches</li>
          ) : (
            filtered.map((c) => (
              <li key={c.business_id!}>
                <button
                  type="button"
                  className={`block w-full px-2 py-1.5 text-left hover:bg-slate-50 ${
                    c.business_id === draftBusinessId ? "bg-violet-50 font-medium text-violet-900" : ""
                  }`}
                  onClick={() => {
                    setDraftBusinessId(c.business_id!);
                    void commit(c.business_id!);
                  }}
                >
                  {companyLabel(c)}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    );
  }

  const matched = currentBusinessId
    ? companies.find((c) => c.business_id === currentBusinessId)
    : null;
  const displayLabel =
    matched != null
      ? companyLabel(matched)
      : companyName && currentBusinessId
        ? formatLabelWithBusinessId(companyName, currentBusinessId)
        : companyName;

  return (
    <div
      className={inlineFieldShellClass(editHighlight, false)}
      {...editableFieldProps(editHighlight, beginEdit)}
    >
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>{displayLabel?.trim() || "No Company"}</FieldValue>
    </div>
  );
}
