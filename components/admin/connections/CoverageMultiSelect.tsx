"use client";

import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";

export function CoverageMultiSelect({
  value,
  onChange,
  compact = false,
  options,
  emptyLabel = "Coverage",
  clearLabel = "Clear coverage",
  allowSelectAll = false,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  compact?: boolean;
  options: readonly string[];
  emptyLabel?: string;
  clearLabel?: string;
  allowSelectAll?: boolean;
}) {
  const selected = new Set(value);
  const allSelected = options.length > 0 && options.every((option) => selected.has(option));
  const label =
    value.length === 0
      ? emptyLabel
      : value.length === 1
        ? `${emptyLabel}: ${value[0]}`
        : `${emptyLabel} (${value.length})`;
  const active = value.length > 0;

  function toggle(option: string) {
    onChange(selected.has(option) ? value.filter((item) => item !== option) : [...value, option]);
  }

  return (
    <details className="relative inline-block w-fit min-w-0 max-w-full">
      <summary
        className={`cursor-pointer list-none rounded-md border marker:hidden ${connectionsGlassClasses.inputFocus} ${
          compact ? "px-2 py-1.5 text-xs" : "min-w-[8.5rem] px-2 py-1.5 text-sm"
        } ${active ? "border-violet-300 bg-violet-50 text-violet-900" : "border-slate-200 bg-white text-slate-800"}`}
        title={value.length > 0 ? `${emptyLabel}: ${value.join(", ")}` : emptyLabel}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="max-w-[12.5rem] truncate">{label}</span>
          <span className="text-[10px] text-slate-400">▼</span>
        </span>
      </summary>
      <div className="absolute left-0 z-30 mt-1 min-w-[13rem] max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white p-2 shadow-lg sm:left-auto sm:right-0">
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {options.map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={selected.has(option)}
                onChange={() => toggle(option)}
                className="rounded border-slate-300"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
          {allowSelectAll ? (
            <button
              type="button"
              onClick={() => onChange(allSelected ? [] : [...options])}
              className="text-xs font-semibold text-violet-700"
            >
              {allSelected ? "Clear" : "Select all"}
            </button>
          ) : (
            <span />
          )}
          {value.length > 0 ? (
            <button type="button" onClick={() => onChange([])} className="text-xs font-semibold text-slate-600 hover:text-slate-900">
              {clearLabel}
            </button>
          ) : null}
        </div>
      </div>
    </details>
  );
}
