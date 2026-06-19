"use client";

import { labelCompanyV1 } from "@/lib/companyV1Display";
import { initialPremisesRelationshipLines } from "@/lib/premisesRelationships";
import { PremisesSectionCard } from "@/components/admin/properties-v1/premisesDrawerUi";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import type { PremisesRelationshipLine } from "@/lib/v1ListValues";

function display(v: string | null | undefined): string {
  if (!v?.trim()) return "—";
  return v.trim();
}

export function PremisesRelationshipsTable({
  relationships,
  companyLabels,
  contactLabels,
}: {
  relationships: PremisesRelationshipLine[];
  companyLabels: Map<string, string>;
  contactLabels: Map<string, string>;
}) {
  const rows = relationships.filter(
    (line) =>
      line.company_id?.trim() ||
      line.contact_id?.trim() ||
      line.remarks?.trim() ||
      line.partnership_mode?.trim(),
  );

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">No relationships recorded.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/80 bg-white/70">
      <table className="min-w-full text-sm">
        <thead className="bg-blue-50/80 text-left text-xs text-slate-500">
          <tr>
            <th className="px-3 py-2 font-medium">Role</th>
            <th className="px-3 py-2 font-medium">Company</th>
            <th className="px-3 py-2 font-medium">Contact</th>
            <th className="px-3 py-2 font-medium">Partnership</th>
            <th className="px-3 py-2 font-medium">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((line, i) => (
            <tr key={i} className="border-t border-slate-100 align-top">
              <td className="px-3 py-2 text-slate-800">{display(line.relationship_type)}</td>
              <td className="px-3 py-2 text-slate-800">{labelCompanyV1(companyLabels, line.company_id)}</td>
              <td className="px-3 py-2 text-slate-800">
                {line.contact_id ? (contactLabels.get(line.contact_id) ?? line.contact_id) : "—"}
              </td>
              <td className="px-3 py-2 text-slate-800">{display(line.partnership_mode ?? line.contact_role)}</td>
              <td className="max-w-[12rem] px-3 py-2 whitespace-pre-wrap text-slate-700">{display(line.remarks)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PremisesRelationshipsTab({
  premises,
  companyLabels,
  contactLabels,
  onAddRelationship,
}: {
  premises: PremisesV1;
  companyLabels: Map<string, string>;
  contactLabels: Map<string, string>;
  onAddRelationship: () => void;
}) {
  const relationships = initialPremisesRelationshipLines(premises);

  return (
    <PremisesSectionCard title="Parties">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-slate-600">Companies and contacts linked to this premises.</p>
        <button
          type="button"
          onClick={onAddRelationship}
          className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Add relationship
        </button>
      </div>
      <PremisesRelationshipsTable
        relationships={relationships}
        companyLabels={companyLabels}
        contactLabels={contactLabels}
      />
    </PremisesSectionCard>
  );
}
