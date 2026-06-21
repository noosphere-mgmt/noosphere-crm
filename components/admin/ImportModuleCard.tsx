"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { ImportObjectType } from "@/lib/import/types";

type Props = {
  objectType: ImportObjectType;
  label: string;
  uploadAction: (formData: FormData) => Promise<void>;
  focused?: boolean;
};

const linkClass = "shrink-0 text-xs font-medium text-slate-600 underline hover:text-slate-900";
const exportLinkClass = "shrink-0 text-xs font-medium text-blue-700 underline hover:text-blue-900";

export function ImportModuleCard({
  objectType,
  label,
  uploadAction,
  focused = false,
}: Props) {
  const inputId = useId();
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form
      id={`import-${objectType}`}
      action={uploadAction}
      encType="multipart/form-data"
      className={`px-3 py-2.5 ${focused ? "bg-slate-50" : "bg-white"}`}
    >
      <input type="hidden" name="object_type" value={objectType} />

      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 sm:gap-x-3">
        <span className="w-24 shrink-0 text-sm font-medium text-slate-900 sm:w-28">{label}</span>

        <label
          htmlFor={inputId}
          className="flex min-w-[6rem] flex-1 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-600 sm:min-w-[8.5rem]"
        >
          <span className="shrink-0 font-medium text-slate-700">Browse…</span>
          <span className="min-w-0 truncate">{fileName ?? "No file selected"}</span>
        </label>
        <input
          id={inputId}
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />

        <button
          type="submit"
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Upload CSV
        </button>

        <a href={`/api/admin/import/template/${objectType}`} className={linkClass}>
          Template
        </a>
        <a href={`/api/admin/import/export/${objectType}`} className={exportLinkClass}>
          Export all
        </a>
      </div>
    </form>
  );
}
