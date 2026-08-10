"use client";

import { useMemo, useState } from "react";
import {
  analyseOpportunityRequirement,
  requirementSuggestionDisplayValue,
  type RequirementSuggestion,
} from "@/lib/opportunityRequirementAnalysis";
import type { Opportunity } from "@/lib/types/entities";

function defaultsFromSuggestions(text: string, suggestions: RequirementSuggestion[]): Partial<Opportunity> {
  const values = Object.fromEntries(suggestions.map((item) => [item.field, item.value]));
  return {
    sales_role: (values.sales_role as Opportunity["sales_role"] | undefined) ?? "to_lease",
    property_category_preference: String(values.property_category_preference ?? "") || null,
    property_type_preference: String(values.property_type_preference ?? "") || null,
    district_preference: String(values.district_preference ?? "") || null,
    required_area_sqft: values.required_area_sqft != null ? String(values.required_area_sqft) : null,
    required_capacity_pax: values.required_capacity_pax != null ? Number(values.required_capacity_pax) : null,
    budget_max: values.budget_max != null ? String(values.budget_max) : null,
    requirement_summary: text.trim(),
  };
}

export function OpportunityCreationIntake({
  initiallyOpen = false,
  onApply,
}: {
  initiallyOpen?: boolean;
  onApply: (defaults: Partial<Opportunity>) => void;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const [text, setText] = useState("");
  const [analysed, setAnalysed] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const suggestions = useMemo(() => analysed ? analyseOpportunityRequirement(text) : [], [analysed, text]);

  function analyse() {
    const next = analyseOpportunityRequirement(text);
    setAnalysed(true);
    setSelected(new Set(next.map((item) => item.field)));
  }

  function apply() {
    onApply(defaultsFromSuggestions(text, suggestions.filter((item) => selected.has(item.field))));
  }

  return (
    <section className="mb-5 rounded-xl border border-violet-200 bg-violet-50/50">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-violet-600">✦</span>
            <h3 className="text-sm font-semibold text-slate-900">Capture requirement first</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 ring-1 ring-violet-200">AI-ready</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">Paste the conversation and prefill the new Opportunity form.</p>
        </div>
        <span className="text-lg text-violet-700">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-violet-100 px-4 py-4">
          <textarea rows={6} value={text} onChange={(event) => { setText(event.target.value); setAnalysed(false); }}
            placeholder="Paste the initial enquiry, WhatsApp message, email notes or conversation…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
          <button type="button" onClick={analyse} disabled={!text.trim()}
            className="rounded-lg bg-violet-700 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-40">Analyse requirements</button>
          {analysed ? (
            <div className="space-y-2">
              {suggestions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((item) => (
                    <label key={item.field} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs ${selected.has(item.field) ? "border-violet-400 bg-white text-violet-900" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                      <input type="checkbox" checked={selected.has(item.field)} onChange={() => setSelected((current) => {
                        const next = new Set(current); if (next.has(item.field)) next.delete(item.field); else next.add(item.field); return next;
                      })} className="sr-only" />
                      {item.label}: {requirementSuggestionDisplayValue(item)}
                    </label>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-600">No structured fields were identified; the full text will still be retained.</p>}
              <button type="button" onClick={apply}
                className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50">Prefill Opportunity form</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
