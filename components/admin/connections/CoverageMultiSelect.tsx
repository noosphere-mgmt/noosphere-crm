"use client";

import { COVERAGE_OPTIONS } from "@/lib/connectionsValues";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";

export function CoverageMultiSelect({
  value,
  onChange,
  compact = false,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  compact?: boolean;
}) {
  const selected = new Set(value);
  const label = value.length === 0 ? "Coverage" : value.length === 1 ? value[0] : `Coverage (${value.length})`;

  function toggle(option: string) {
    onChange(selected.has(option) ? value.filter((item) => item !== option) : [...value, option]);
  }

  return (
    <details className="relative shrink-0">
      <summary
        className={`cursor-pointer list-none rounded-md border border-slate-200 bg-white text-slate-800 marker:hidden ${connectionsGlassClasses.inputFocus} ${
          compact ? "px-2 py-1.5 text-xs" : "min-w-[8.5rem] px-2 py-1.5 text-sm"
        }`}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="max-w-[11rem] truncate">{label}</span>
          <span className="text-[10px] text-slate-400">▼</span>
        </span>
      </summary>
      <div className="absolute right-0 z-30 mt-1 min-w-[13rem] rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {COVERAGE_OPTIONS.map((option) => (
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
        {value.length > 0 ? (
          <button type="button" onClick={() => onChange([])} className="mt-2 w-full border-t border-slate-100 pt-2 text-left text-xs font-semibold text-violet-700">
            Clear coverage
          </button>
        ) : null}
      </div>
    </details>
  );
}
