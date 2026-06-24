"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { patchPremisesFieldAction } from "@/app/admin/properties/actions";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import {
  formatPremisesRelationshipCompanyLabel,
  formatPremisesRelationshipContactLabel,
} from "@/lib/premisesDetailDisplay";
import { asArray } from "@/lib/asArray";
import { asCompanyV1Options, asContactV1Options } from "@/lib/premisesClientData";
import { toCompanyV1SelectOptions } from "@/lib/companyV1Display";
import { toContactV1SelectOptions } from "@/lib/contactV1Display";
import {
  coerceRelationshipLinesForSelect,
  emptyRelationshipLine,
  initialPremisesRelationshipLines,
  relationshipLineHasContent,
} from "@/lib/premisesRelationships";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import {
  OPPORTUNITY_PARTNERSHIP_MODES,
  OPPORTUNITY_PARTNERSHIP_MODE_LABELS,
} from "@/lib/opportunityValues";
import {
  PREMISES_RELATIONSHIP_TYPES,
  type PremisesRelationshipLine,
} from "@/lib/v1ListValues";

const selectClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900";
const inputClass = selectClass;

function display(v: string | null | undefined): string {
  if (!v?.trim()) return "—";
  return v.trim();
}

function contactsForCompany(
  contacts: ContactV1Option[] | null | undefined,
  companySelectValue: string | null,
  companyOptions: ReturnType<typeof toCompanyV1SelectOptions>,
) {
  const safeContacts = asContactV1Options(contacts);
  if (!companySelectValue) return safeContacts;
  const opt = companyOptions.find((o) => o.value === companySelectValue);
  const v1CompanyId = opt?.v1Id ?? companySelectValue;
  return safeContacts.filter(
    (c) => c.company_id === v1CompanyId || c.company_id === companySelectValue,
  );
}

function RelationshipLineFields({
  line,
  index,
  companyOptions,
  contacts,
  contactSelectOptions,
  onChange,
}: {
  line: PremisesRelationshipLine;
  index: number;
  companyOptions: ReturnType<typeof toCompanyV1SelectOptions>;
  contacts: ContactV1Option[];
  contactSelectOptions: ReturnType<typeof toContactV1SelectOptions>;
  onChange: (patch: Partial<PremisesRelationshipLine>) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium text-slate-700">
        Relationship type
        <select
          className={selectClass}
          value={line.relationship_type}
          onChange={(e) => onChange({ relationship_type: e.target.value })}
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
          onChange={(e) => onChange({ company_id: e.target.value || null, contact_id: null })}
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
          onChange={(e) => onChange({ contact_id: e.target.value || null })}
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
          onChange={(e) => onChange({ partnership_mode: e.target.value || null })}
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
          onChange={(e) => onChange({ contact_role: e.target.value || null })}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
        Remarks
        <textarea
          className={inputClass}
          rows={2}
          value={line.remarks ?? ""}
          onChange={(e) => onChange({ remarks: e.target.value || null })}
        />
      </label>
    </div>
  );
}

function PremisesRelationshipsManager({
  premises,
  companies,
  contacts,
  companyLabels,
  contactLabels,
}: {
  premises: PremisesV1;
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
  companyLabels: Map<string, string>;
  contactLabels: Map<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const companyOptions = useMemo(
    () => toCompanyV1SelectOptions(asCompanyV1Options(companies)),
    [companies],
  );
  const contactSelectOptions = useMemo(
    () => toContactV1SelectOptions(asContactV1Options(contacts)),
    [contacts],
  );

  const [lines, setLines] = useState<PremisesRelationshipLine[]>(() =>
    coerceRelationshipLinesForSelect(initialPremisesRelationshipLines(premises), companyOptions),
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<PremisesRelationshipLine | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLines(coerceRelationshipLinesForSelect(initialPremisesRelationshipLines(premises), companyOptions));
    setEditingIndex(null);
    setDraft(null);
    setAdding(false);
    setError(null);
  }, [premises.premises_id, premises.updated_at, companyOptions, premises]);

  const visibleRows = asArray<PremisesRelationshipLine>(lines)
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => relationshipLineHasContent(line));

  function persist(nextLines: unknown, onDone?: () => void) {
    const normalized = asArray<PremisesRelationshipLine>(nextLines);
    setError(null);
    startTransition(async () => {
      const result = await patchPremisesFieldAction(
        premises.premises_id,
        "relationship_lines",
        JSON.stringify(normalized),
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLines(coerceRelationshipLinesForSelect(normalized, companyOptions));
      onDone?.();
      router.refresh();
    });
  }

  function handleDelete(index: number) {
    if (!window.confirm("Remove this relationship?")) return;
    const next = asArray<PremisesRelationshipLine>(lines).filter((_, i) => i !== index);
    persist(next.length > 0 ? next : [emptyRelationshipLine()]);
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setDraft({ ...lines[index]! });
    setAdding(false);
  }

  function saveEdit() {
    if (editingIndex == null || !draft) return;
    if (!relationshipLineHasContent(draft)) {
      setError("Select a relationship type, company, or contact");
      return;
    }
    const next = asArray<PremisesRelationshipLine>(lines).map((line, i) => (i === editingIndex ? draft : line));
    persist(next, () => {
      setEditingIndex(null);
      setDraft(null);
    });
  }

  function startAdd() {
    setAdding(true);
    setEditingIndex(null);
    setDraft(emptyRelationshipLine());
  }

  function saveAdd() {
    if (!draft) return;
    if (!relationshipLineHasContent(draft)) {
      setError("Select a relationship type, company, or contact");
      return;
    }
    const base = asArray<PremisesRelationshipLine>(lines).filter(relationshipLineHasContent);
    persist([...base, draft], () => {
      setAdding(false);
      setDraft(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-white/80 bg-white/70">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-50/80 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Company</th>
              <th className="px-3 py-2 font-medium">Contact</th>
              <th className="px-3 py-2 font-medium">Partnership</th>
              <th className="px-3 py-2 font-medium">Remarks</th>
              <th className="w-24 px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No relationships recorded.
                </td>
              </tr>
            ) : (
              visibleRows.map(({ line, index }) =>
                editingIndex === index && draft ? (
                  <tr key={index} className="border-t border-slate-100 bg-blue-50/40">
                    <td colSpan={6} className="px-3 py-3">
                      <RelationshipLineFields
                        line={draft}
                        index={index}
                        companyOptions={companyOptions}
                        contacts={contacts}
                        contactSelectOptions={contactSelectOptions}
                        onChange={(patch) => setDraft((prev) => ({ ...prev!, ...patch }))}
                      />
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={saveEdit}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIndex(null);
                            setDraft(null);
                          }}
                          className="rounded-md px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={index} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2 text-slate-800">{display(line.relationship_type)}</td>
                    <td className="px-3 py-2 text-slate-800">
                      {formatPremisesRelationshipCompanyLabel(companyLabels, line.company_id, companyOptions)}
                    </td>
                    <td className="px-3 py-2 text-slate-800">
                      {formatPremisesRelationshipContactLabel(contactLabels, line.contact_id)}
                    </td>
                    <td className="px-3 py-2 text-slate-800">{display(line.partnership_mode ?? line.contact_role)}</td>
                    <td className="max-w-[12rem] px-3 py-2 whitespace-pre-wrap text-slate-700">{display(line.remarks)}</td>
                    <td className="px-3 py-2">
                      <ModuleRowActions
                        module="properties"
                        onEdit={() => startEdit(index)}
                        onDelete={() => handleDelete(index)}
                      />
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>

      {adding && draft ? (
        <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/30 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-900">Add relationship</p>
          <RelationshipLineFields
            line={draft}
            index={-1}
            companyOptions={companyOptions}
            contacts={contacts}
            contactSelectOptions={contactSelectOptions}
            onChange={(patch) => setDraft((prev) => ({ ...prev!, ...patch }))}
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={saveAdd}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save relationship"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setDraft(null);
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={startAdd}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          + Add relationship
        </button>
      )}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

export function PremisesRelationshipsTab({
  premises,
  companyLabels,
  contactLabels,
  companies,
  contacts,
  onAddRelationship: _onAddRelationship,
}: {
  premises: PremisesV1;
  companyLabels: Map<string, string>;
  contactLabels: Map<string, string>;
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
  onAddRelationship: () => void;
}) {
  return (
    <PremisesSectionCard title="Parties">
      <p className="mb-3 text-sm text-slate-600">Companies and contacts linked to this premises.</p>
      <PremisesRelationshipsManager
        premises={premises}
        companies={companies}
        contacts={contacts}
        companyLabels={companyLabels}
        contactLabels={contactLabels}
      />
    </PremisesSectionCard>
  );
}
