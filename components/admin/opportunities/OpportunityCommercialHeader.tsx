"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { patchOpportunityFieldAction } from "@/app/admin/opportunities/actions";
import { useOptionalInlineEdit } from "@/components/admin/inline/InlineEditProvider";
import {
  OPPORTUNITY_STATUS_LABELS,
  OPPORTUNITY_STATUS_PROBABILITY,
  formatOpportunityActionDate,
} from "@/lib/lookups";
import { opportunityStatusChip } from "@/lib/opportunityStatusTheme";
import type { Opportunity, OpportunityStatus } from "@/lib/types/entities";

const controlClass =
  "w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

function Metric({
  label,
  children,
  tone = "border-slate-200 bg-white",
  hint,
}: {
  label: string;
  children: React.ReactNode;
  tone?: string;
  hint?: string;
}) {
  return (
    <div className={`min-w-0 rounded-lg border px-3 py-1.5 ${tone}`} title={hint}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-900">{children}</dd>
    </div>
  );
}

function QuickTextControl({
  value,
  onSave,
  type = "text",
  displayValue,
}: {
  value: string | null;
  onSave: (value: string | null) => Promise<boolean>;
  type?: string;
  displayValue?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function commit() {
    const next = draft.trim() || null;
    if ((next ?? "") === (value ?? "").trim()) {
      setEditing(false);
      return;
    }
    const ok = await onSave(next);
    if (ok) setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        className={controlClass}
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
    );
  }

  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center rounded-md px-1 py-1 text-left text-sm font-semibold text-slate-900 hover:bg-white/70"
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      <span className={value?.trim() ? "" : "text-slate-400"}>
        {value?.trim() ? displayValue || value : "—"}
      </span>
    </button>
  );
}

export function OpportunityCommercialHeader({ opportunity }: { opportunity: Opportunity }) {
  const router = useRouter();
  const inline = useOptionalInlineEdit();
  const [status, setStatus] = useState<OpportunityStatus>(opportunity.status);
  const [editingStatus, setEditingStatus] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const statusSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    setStatus(opportunity.status);
    setEditingStatus(false);
  }, [opportunity.id, opportunity.status]);

  useEffect(() => {
    if (editingStatus) statusSelectRef.current?.focus();
  }, [editingStatus]);

  const saveField = useCallback(
    async (field: string, value: unknown) => {
      const run = async () => {
        const result = await patchOpportunityFieldAction(
          opportunity.id,
          field,
          JSON.stringify(value),
        );
        return { ok: result.ok, error: result.ok ? undefined : result.error };
      };
      if (inline) return inline.runSave(run);
      const result = await run();
      if (result.ok) router.refresh();
      return result.ok;
    },
    [inline, opportunity.id, router],
  );

  async function onStatusChange(next: OpportunityStatus) {
    if (next === status) {
      setEditingStatus(false);
      return;
    }
    const previous = status;
    setStatus(next);
    setSavingStatus(true);
    const ok = await saveField("status", next);
    setSavingStatus(false);
    if (!ok) setStatus(previous);
    setEditingStatus(false);
  }

  const probability = OPPORTUNITY_STATUS_PROBABILITY[status];
  const chip = opportunityStatusChip(status);
  const saveHint =
    inline?.saveStatus === "saving" || savingStatus
      ? "Saving…"
      : inline?.saveStatus === "saved"
        ? "Saved"
        : inline?.saveStatus === "error"
          ? inline.saveError ?? "Save failed"
          : null;

  return (
    <section className="min-w-[20rem] sm:min-w-[28rem]">
      <dl className="grid grid-cols-3 gap-1.5">
        <Metric
          label="Status"
          tone="border-violet-100 bg-violet-50/70"
          hint="Click to change status — saves immediately"
        >
          {editingStatus ? (
            <select
              ref={statusSelectRef}
              value={status}
              disabled={savingStatus}
              onChange={(e) => void onStatusChange(e.target.value as OpportunityStatus)}
              onBlur={() => setEditingStatus(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditingStatus(false);
              }}
              aria-label="Opportunity status"
              className={`${controlClass} cursor-pointer border-violet-200 disabled:opacity-60`}
            >
              {Object.entries(OPPORTUNITY_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={() => setEditingStatus(true)}
              className="mt-0.5 inline-flex max-w-full"
              title="Click to change status"
            >
              <span {...chip} className={`${chip.className} max-w-full truncate`}>
                {OPPORTUNITY_STATUS_LABELS[status]}
              </span>
            </button>
          )}
        </Metric>
        <Metric label="Probability" tone="border-emerald-100 bg-emerald-50/70">
          <div className="flex items-center px-1 py-1">
            <span className="text-base font-bold tabular-nums text-emerald-800">
              {probability != null ? `${probability}%` : "—"}
            </span>
          </div>
        </Metric>
        <Metric
          label="Expected Close"
          tone="border-sky-100 bg-sky-50/70"
          hint="Click to edit — saves immediately"
        >
          <QuickTextControl
            type="date"
            value={opportunity.expected_close_date?.slice(0, 10) ?? null}
            displayValue={formatOpportunityActionDate(opportunity.expected_close_date)}
            onSave={(value) => saveField("expected_close_date", value)}
          />
        </Metric>
      </dl>
      {saveHint ? (
        <p
          className={`mt-1.5 text-right text-xs font-medium ${
            inline?.saveStatus === "error" ? "text-rose-600" : "text-slate-500"
          }`}
        >
          {saveHint}
        </p>
      ) : null}
    </section>
  );
}
