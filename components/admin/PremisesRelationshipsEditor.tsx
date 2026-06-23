"use client";

import { useMemo, useState } from "react";
import type { CompanyV1SelectOption } from "@/lib/companyV1Display";
import { toContactV1SelectOptions } from "@/lib/contactV1Display";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import {
  coerceRelationshipLinesForSelect,
  emptyRelationshipLine,
  initialPremisesRelationshipLines,
} from "@/lib/premisesRelationships";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import {
  OPPORTUNITY_PARTNERSHIP_MODES,
  OPPORTUNITY_PARTNERSHIP_MODE_LABELS,
} from "@/lib/opportunityValues";
import { PREMISES_RELATIONSHIP_TYPES, type PremisesRelationshipLine } from "@/lib/v1ListValues";

const selectClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900";
const inputClass = selectClass;

function contactsForCompany(
  contacts: ContactV1Option[],
  companySelectValue: string | null,
  companyOptions: CompanyV1SelectOption[],
) {
  if (!companySelectValue) return contacts;
  const opt = companyOptions.find((o) => o.value === companySelectValue);
  const v1CompanyId = opt?.v1Id ?? companySelectValue;
  return contacts.filter(
    (c) => c.company_id === v1CompanyId || c.company_id === companySelectValue,
  );
}

export function PremisesRelationshipsEditor({
  premises,
  companyOptions,
  contacts,
}: {
  premises: PremisesV1;
  companyOptions: CompanyV1SelectOption[];
  contacts: ContactV1Option[];
}) {
  const [lines, setLines] = useState<PremisesRelationshipLine[]>(() =>
    coerceRelationshipLinesForSelect(initialPremisesRelationshipLines(premises), companyOptions),
  );

  const contactSelectOptions = useMemo(() => toContactV1SelectOptions(contacts), [contacts]);

  function updateLine(index: number, patch: Partial<PremisesRelationshipLine>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="relationship_lines" value={JSON.stringify(lines)} />
      {lines.map((line, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800">Line {index + 1}</p>
            {lines.length > 1 ? (
              <button
                type="button"
                className="text-xs font-semibold text-red-600 hover:text-red-800"
                onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Relationship type
              <select
                className={selectClass}
                value={line.relationship_type}
                onChange={(e) => updateLine(index, { relationship_type: e.target.value })}
              >
                <option value="">— Select —</option>
                {PREMISES_RELATIONSHIP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Company
              <select
                className={selectClass}
                value={line.company_id ?? ""}
                onChange={(e) =>
                  updateLine(index, { company_id: e.target.value || null, contact_id: null })
                }
              >
                <option value="">— Select company —</option>
                {companyOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Contact
              <select
                className={selectClass}
                value={line.contact_id ?? ""}
                onChange={(e) => updateLine(index, { contact_id: e.target.value || null })}
              >
                <option value="">— Select contact —</option>
                {contactsForCompany(contacts, line.company_id, companyOptions).map((c) => {
                  const opt = contactSelectOptions.find((o) => o.value === c.contact_id);
                  return (
                    <option key={c.contact_id} value={c.contact_id}>
                      {opt?.label ?? c.display_name}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Partnership mode
              <select
                className={selectClass}
                value={line.partnership_mode ?? ""}
                onChange={(e) => updateLine(index, { partnership_mode: e.target.value || null })}
              >
                <option value="">— Select —</option>
                {OPPORTUNITY_PARTNERSHIP_MODES.map((m) => (
                  <option key={m} value={m}>
                    {OPPORTUNITY_PARTNERSHIP_MODE_LABELS[m]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Contact role
              <input
                className={inputClass}
                value={line.contact_role ?? ""}
                onChange={(e) => updateLine(index, { contact_role: e.target.value || null })}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Source URL
              <input
                className={inputClass}
                value={line.source_url ?? ""}
                onChange={(e) => updateLine(index, { source_url: e.target.value || null })}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Source file
              <input
                className={inputClass}
                value={line.source_file ?? ""}
                onChange={(e) => updateLine(index, { source_file: e.target.value || null })}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Remarks
              <textarea
                className={inputClass}
                rows={2}
                value={line.remarks ?? ""}
                onChange={(e) => updateLine(index, { remarks: e.target.value || null })}
              />
            </label>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        onClick={() => setLines((prev) => [...prev, emptyRelationshipLine()])}
      >
        + Add relationship
      </button>
    </div>
  );
}
