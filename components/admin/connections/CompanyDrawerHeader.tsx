"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { companyDrawerFullFormId } from "@/components/admin/connections/CompanyDrawerFullEdit";
import { IconPen, IconX } from "@/components/admin/ModuleActionIcons";
import { ModuleActionBar, moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { InlineSaveStatus } from "@/components/admin/inline/InlineRecordChrome";
import { useInlineEdit } from "@/components/admin/inline/InlineEditProvider";
import { companyDrawerHref } from "@/lib/connectionsDrawerNav";

export function CompanyDrawerHeader({
  companyId,
  title,
  subtitle,
  fullEdit,
  onClose,
}: {
  companyId: number;
  title: string;
  subtitle?: string | null;
  fullEdit: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { editHighlight, setEditHighlight } = useInlineEdit();
  const formId = companyDrawerFullFormId(companyId);

  function exitFullEdit() {
    router.push(companyDrawerHref("/admin/companies", searchParams, companyId, "overview"));
  }

  function enterFullEdit() {
    router.push(companyDrawerHref("/admin/companies", searchParams, companyId, "overview", "full"));
  }

  return (
    <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{fullEdit ? "Edit company" : editHighlight ? "Click a field to edit" : "Review"}</p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {fullEdit ? (
            <ModuleActionBar mode="edit" formId={formId} onCancel={exitFullEdit} module="connections" />
          ) : (
            <>
              <InlineSaveStatus />
              <button
                type="button"
                className={`${moduleEditButtonClass("connections")} ${
                  editHighlight ? "ring-2 ring-[#DDD6FE]" : ""
                }`}
                onClick={() => setEditHighlight(!editHighlight)}
                aria-label={editHighlight ? "Hide editable fields" : "Show editable fields"}
                title={editHighlight ? "Hide editable fields" : "Inline edit"}
              >
                <IconPen />
              </button>
              <button
                type="button"
                onClick={enterFullEdit}
                className={`rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] px-2.5 py-1.5 text-sm font-medium text-[#5B21B6] hover:bg-[#EDE9FE]`}
              >
                Full edit
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
            title="Close"
          >
            <IconX />
          </button>
        </div>
      </div>
    </div>
  );
}
