"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteCompanyAction,
  getCompanyReferenceSummaryAction,
} from "@/app/admin/companies/actions";
import { IconTrash } from "@/components/admin/ModuleActionIcons";
import { moduleActionButtonClass } from "@/components/admin/ModuleActionBar";
import type { CompanyReferenceSummary } from "@/lib/repos/companyReferences";

export function CompanyDeleteButton({ companyId }: { companyId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<CompanyReferenceSummary | null>(null);
  const [open, setOpen] = useState(false);

  async function handleClick() {
    const result = await getCompanyReferenceSummaryAction(companyId);
    if (!result) return;
    if (result.total > 0) {
      setSummary(result);
      setOpen(true);
      return;
    }
    if (!window.confirm(`Delete company "${result.companyName}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteCompanyAction(companyId);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => void handleClick()}
        className={moduleActionButtonClass.delete}
        aria-label="Delete"
        title="Delete"
      >
        <IconTrash />
      </button>

      {open && summary && summary.total > 0 ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Cannot delete company</h3>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium">{summary.companyName}</span> is referenced by{" "}
              <span className="font-medium">{summary.total}</span> record
              {summary.total === 1 ? "" : "s"}.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {summary.items.map((item) => (
                <li key={item.module}>
                  {item.label}: {item.count}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <a
                href={`/admin/companies?company=${companyId}&tab=premises`}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View references
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
