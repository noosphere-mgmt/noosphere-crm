"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { patchOpportunityFieldAction } from "@/app/admin/opportunities/actions";
import { analyseOpportunityRequirement, requirementSuggestionDisplayValue } from "@/lib/opportunityRequirementAnalysis";
import type { Opportunity } from "@/lib/types/entities";

export function OpportunityRequirementIntake({ opportunity }: { opportunity: Opportunity }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [analysed, setAnalysed] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const suggestions = useMemo(() => analysed ? analyseOpportunityRequirement(text) : [], [analysed, text]);

  function runAnalysis() {
    const next = analyseOpportunityRequirement(text);
    setAnalysed(true);
    setSelected(new Set(next.map((item) => item.field)));
    setMessage(next.length ? null : "No structured fields were identified. The complete text can still be retained in Requirement Notes.");
  }

  function toggle(field: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(field)) next.delete(field); else next.add(field);
      return next;
    });
  }

  function applySuggestions() {
    startTransition(async () => {
      setMessage(null);
      const ordered = suggestions.filter((item) => item.field === "sales_role" && selected.has(item.field))
        .concat(suggestions.filter((item) => item.field !== "sales_role" && selected.has(item.field)));
      for (const item of ordered) {
        const result = await patchOpportunityFieldAction(opportunity.id, item.field, JSON.stringify(item.value));
        if (!result.ok) {
          setMessage(result.error);
          return;
        }
      }
      const existing = opportunity.requirement_summary?.trim();
      const combined = existing ? `${existing}\n\n--- Requirement intake ---\n${text.trim()}` : text.trim();
      const noteResult = await patchOpportunityFieldAction(opportunity.id, "requirement_summary", JSON.stringify(combined));
      if (!noteResult.ok) {
        setMessage(noteResult.error);
        return;
      }
      setMessage("Structured suggestions applied and the original requirement text was retained in Requirement Notes.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/40">
      <button type="button" onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-violet-600" aria-hidden="true">✦</span>
          <h2 className="text-sm font-semibold text-slate-900">AI requirement</h2>
          <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 ring-1 ring-violet-200">Paste & analyse</span>
          {!open ? (
            <span className="truncate text-xs text-slate-500">Extract fields from conversation text</span>
          ) : null}
        </div>
        <span className="text-base text-violet-700">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-violet-100 px-4 py-4">
          <textarea value={text} onChange={(event) => { setText(event.target.value); setAnalysed(false); }} rows={6}
            placeholder="Paste the client conversation or requirement here…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={runAnalysis} disabled={!text.trim() || pending}
              className="rounded-lg bg-violet-700 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-40">Analyse requirements</button>
            <p className="text-xs text-slate-500">Nothing is saved until you review and apply it.</p>
          </div>
          {analysed && suggestions.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <span /><span>Field</span><span>Suggested value</span><span>Confidence</span>
              </div>
              {suggestions.map((item) => (
                <label key={item.field} className="grid cursor-pointer grid-cols-[auto_1fr_1fr_auto] gap-3 border-t border-slate-100 px-3 py-2 text-sm hover:bg-violet-50/30">
                  <input type="checkbox" checked={selected.has(item.field)} onChange={() => toggle(item.field)} className="mt-1 rounded border-slate-300" />
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-medium text-slate-900">{requirementSuggestionDisplayValue(item)}</span>
                  <span className="text-xs text-slate-500">{item.confidence}</span>
                </label>
              ))}
            </div>
          ) : null}
          {analysed ? (
            <button type="button" onClick={applySuggestions} disabled={pending || !text.trim()}
              className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50 disabled:opacity-40">
              {pending ? "Applying…" : "Apply selected & retain original text"}
            </button>
          ) : null}
          {message ? <p className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">{message}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
