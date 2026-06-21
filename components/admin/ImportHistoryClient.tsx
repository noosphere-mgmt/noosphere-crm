"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { bulkDeleteImportRunsAction } from "@/app/admin/import/actions";
import { moduleActionButtonClass } from "@/components/admin/ModuleActionBar";
import { IconTrash } from "@/components/admin/ModuleActionIcons";
import { IMPORT_OBJECT_LABELS } from "@/lib/import/types";
import type { ImportRun } from "@/lib/repos/importRuns";

function formatRunDate(importDate: string): string {
  return importDate.slice(0, 16).replace("T", " ");
}

function downloadHref(runId: number, kind: "upload" | "created" | "updated" | "errors"): string {
  return `/api/admin/import/runs/${runId}/download?kind=${kind}`;
}

function DownloadLink({
  href,
  label,
  count,
  disabled,
  className,
}: {
  href: string;
  label: string;
  count?: number;
  disabled?: boolean;
  className?: string;
}) {
  if (disabled) {
    return (
      <span className={`text-slate-400 ${className ?? ""}`} title={`No ${label.toLowerCase()} rows`}>
        {count ?? label}
      </span>
    );
  }

  return (
    <a
      href={href}
      download
      className={`font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-600 ${className ?? ""}`}
      title={`Download ${label.toLowerCase()} CSV`}
    >
      {count ?? label}
    </a>
  );
}

export function ImportHistoryClient({ runs }: { runs: ImportRun[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [pending, startTransition] = useTransition();

  const runIds = useMemo(() => runs.map((run) => run.id), [runs]);
  const allSelected = runIds.length > 0 && runIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(runIds));
  }

  function onBulkDelete() {
    if (!someSelected) return;
    if (!window.confirm(`Delete ${selected.size} selected import run(s)? Uploaded files and row data will be removed.`)) {
      return;
    }

    const formData = new FormData();
    formData.set("import_run_ids", [...selected].join(","));
    startTransition(async () => {
      await bulkDeleteImportRunsAction(formData);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Download the original upload or outcome CSVs. Select runs to delete them and free stored upload data.
        </p>
        {someSelected ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">{selected.size} selected</span>
            <button
              type="button"
              disabled={pending}
              onClick={onBulkDelete}
              className={`${moduleActionButtonClass.delete} disabled:cursor-not-allowed disabled:opacity-40`}
              aria-label="Delete selected import runs"
              title="Delete selected import runs"
            >
              <IconTrash />
            </button>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={runs.length === 0 || pending}
                  aria-label="Select all import runs"
                  className="rounded border-slate-300"
                />
              </th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Object</th>
              <th className="px-4 py-3 font-medium">File</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Errors</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No imports yet.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(run.id)}
                      onChange={() => toggleOne(run.id)}
                      disabled={pending}
                      aria-label={`Select import run ${run.id}`}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatRunDate(run.import_date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {IMPORT_OBJECT_LABELS[run.object_type]}
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <DownloadLink
                      href={downloadHref(run.id, "upload")}
                      label={run.filename}
                      className="block truncate font-normal"
                    />
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    <DownloadLink
                      href={downloadHref(run.id, "created")}
                      label="Created"
                      count={run.created_count}
                      disabled={run.created_count === 0}
                    />
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    <DownloadLink
                      href={downloadHref(run.id, "updated")}
                      label="Updated"
                      count={run.updated_count}
                      disabled={run.updated_count === 0}
                    />
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    <DownloadLink
                      href={downloadHref(run.id, "errors")}
                      label="Errors"
                      count={run.error_count}
                      disabled={run.error_count === 0}
                      className={run.error_count > 0 ? "font-semibold text-red-700 decoration-red-200 hover:decoration-red-400" : undefined}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Need a new import?{" "}
        <Link href="/admin/import" className="font-medium text-slate-700 underline">
          Start from the import workbench
        </Link>
        .
      </p>
    </>
  );
}
