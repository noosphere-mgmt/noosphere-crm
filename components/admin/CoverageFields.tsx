"use client";

import { useEffect, useState } from "react";
import { useFormEditing } from "@/components/admin/ModuleActionBar";
import { COVERAGE_OPTIONS } from "@/lib/connectionsValues";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";

export function CoverageFields({
  defaults,
  fieldName = "coverage",
}: {
  defaults?: string[] | null;
  fieldName?: string;
}) {
  const editing = useFormEditing();
  const [selected, setSelected] = useState(new Set(defaults ?? []));

  useEffect(() => {
    setSelected(new Set(defaults ?? []));
  }, [defaults]);

  return (
    <fieldset className="rounded-lg border border-slate-200 p-4">
      <legend className="px-1 text-sm font-medium text-slate-700">Coverage</legend>
      {editing ? (
        <div className="mt-1 flex items-center gap-2 text-xs">
          <button
            type="button"
            className={connectionsGlassClasses.link}
            onClick={() => setSelected(new Set(COVERAGE_OPTIONS))}
          >
            All
          </button>
          <span className="text-slate-300" aria-hidden>
            ·
          </span>
          <button
            type="button"
            className="font-medium text-slate-600 hover:text-slate-900 hover:underline"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
        </div>
      ) : null}
      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COVERAGE_OPTIONS.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name={fieldName}
              value={option}
              checked={selected.has(option)}
              disabled={!editing}
              onChange={() => {
                setSelected((prev) => {
                  const next = new Set(prev);
                  if (next.has(option)) next.delete(option);
                  else next.add(option);
                  return next;
                });
              }}
              className="rounded border-slate-300"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
