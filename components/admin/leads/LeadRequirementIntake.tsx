"use client";

import { useMemo, useState } from "react";
import {
  analyseOpportunityRequirement,
  requirementSuggestionDisplayValue,
  type RequirementSuggestion,
} from "@/lib/opportunityRequirementAnalysis";
import { isOtherSalesRole, isSaleCaseSalesRole, normalizeOpportunitySalesRole } from "@/lib/opportunityValues";
import type { Lead } from "@/lib/repos/leads";

export type LeadRequirementPatch = Partial<
  Pick<
    Lead,
    | "preferred_location"
    | "required_area_sqft"
    | "required_capacity_pax"
    | "requirement_notes"
    | "ai_digest"
    | "office_space_required"
    | "property_category_preference"
    | "property_type_preference"
  >
>;

function patchFromSuggestions(text: string, suggestions: RequirementSuggestion[]): LeadRequirementPatch {
  const values = Object.fromEntries(suggestions.map((item) => [item.field, item.value]));
  const salesRole = values.sales_role != null ? normalizeOpportunitySalesRole(String(values.sales_role)) : null;
  const requiredType =
    values.property_category_preference != null
      ? String(values.property_category_preference)
      : undefined;
  const requiredSubtype =
    values.property_type_preference != null ? String(values.property_type_preference) : undefined;
  const structured: string[] = [];
  if (salesRole) structured.push(`Sales Role: ${salesRole}`);
  if (requiredType) structured.push(`Required Type: ${requiredType}`);
  if (requiredSubtype) structured.push(`Required Subtype: ${requiredSubtype}`);
  if (values.budget_max != null) structured.push(`Budget (HKD): ${values.budget_max}`);

  let office_space_required: boolean | null = null;
  if (salesRole) {
    if (isOtherSalesRole(salesRole)) office_space_required = false;
    else if (isSaleCaseSalesRole(salesRole) || salesRole === "to_lease" || salesRole === "to_let") {
      office_space_required = true;
    }
  }

  const digest = structured.length > 0 ? structured.join(" · ") : null;
  return {
    preferred_location: values.district_preference != null ? String(values.district_preference) : undefined,
    required_area_sqft: values.required_area_sqft != null ? String(values.required_area_sqft) : undefined,
    required_capacity_pax:
      values.required_capacity_pax != null ? Number(values.required_capacity_pax) : undefined,
    property_category_preference: requiredType,
    property_type_preference: requiredSubtype,
    office_space_required: office_space_required ?? undefined,
    requirement_notes: text.trim() || undefined,
    ai_digest: digest ?? undefined,
  };
}

export function LeadRequirementIntake({
  initiallyOpen = false,
  initialText = "",
  onApply,
}: {
  initiallyOpen?: boolean;
  initialText?: string;
  onApply: (patch: LeadRequirementPatch) => void;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const [text, setText] = useState(initialText);
  const [analysed, setAnalysed] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const suggestions = useMemo(
    () => (analysed ? analyseOpportunityRequirement(text) : []),
    [analysed, text],
  );

  function analyse() {
    const next = analyseOpportunityRequirement(text);
    setAnalysed(true);
    setSelected(new Set(next.map((item) => item.field)));
  }

  function apply() {
    onApply(
      patchFromSuggestions(
        text,
        suggestions.filter((item) => selected.has(item.field)),
      ),
    );
  }

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/50">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-violet-600" aria-hidden="true">
              ✦
            </span>
            <h3 className="text-sm font-semibold text-slate-900">AI Capture Requirement</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 ring-1 ring-violet-200">
              Paste & Analyse
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Paste the email or conversation and prefill Office Requirement fields.
          </p>
        </div>
        <span className="text-lg text-violet-700">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-violet-100 px-4 py-4">
          <textarea
            rows={6}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setAnalysed(false);
            }}
            placeholder="Paste the enquiry, WhatsApp message, email notes or conversation…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={analyse}
              disabled={!text.trim()}
              className="rounded-lg bg-violet-700 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-40"
            >
              Analyse Requirements
            </button>
            <p className="text-xs text-slate-500">Nothing is saved until you review and apply it.</p>
          </div>
          {analysed ? (
            <div className="space-y-2">
              {suggestions.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <span />
                    <span>Field</span>
                    <span>Suggested Value</span>
                    <span>Confidence</span>
                  </div>
                  {suggestions.map((item) => (
                    <label
                      key={item.field}
                      className="grid cursor-pointer grid-cols-[auto_1fr_1fr_auto] gap-3 border-t border-slate-100 px-3 py-2 text-sm hover:bg-violet-50/30"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(item.field)}
                        onChange={() =>
                          setSelected((current) => {
                            const next = new Set(current);
                            if (next.has(item.field)) next.delete(item.field);
                            else next.add(item.field);
                            return next;
                          })
                        }
                        className="mt-1 rounded border-slate-300"
                      />
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-medium text-slate-900">
                        {requirementSuggestionDisplayValue(item)}
                      </span>
                      <span className="text-xs text-slate-500">{item.confidence}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  No structured fields were identified; the full text can still be retained in Requirement
                  Notes.
                </p>
              )}
              <button
                type="button"
                onClick={apply}
                className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50"
              >
                Prefill Lead Form
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
