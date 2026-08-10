"use client";

import { useMemo, useState } from "react";
import { BUILDING_RELATIONSHIP_ROLES, normalizeBuildingRelationships, type BuildingRelationshipLine } from "@/lib/buildingRelationships";
import type { CompanyV1SelectOption } from "@/lib/companyV1Display";

export function BuildingRelationshipsEditor({ value, companyOptions }: { value: unknown; companyOptions: CompanyV1SelectOption[] }) {
  const [lines, setLines] = useState<BuildingRelationshipLine[]>(() => normalizeBuildingRelationships(value));
  const update = (index: number, patch: Partial<BuildingRelationshipLine>) => setLines((rows) => rows.map((row, i) => i === index ? { ...row, ...patch } : row));
  return (
    <div className="space-y-2">
      <input type="hidden" name="building_relationship_lines" value={JSON.stringify(lines)} />
      {lines.map((line, index) => (
        <div key={`${index}-${line.company_id}`} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2 sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <select className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm" value={line.role} onChange={(e) => update(index, { role: e.target.value as BuildingRelationshipLine["role"] })}>
            {BUILDING_RELATIONSHIP_ROLES.map((role) => <option key={role}>{role}</option>)}
          </select>
          <select className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm" value={line.company_id} onChange={(e) => update(index, { company_id: e.target.value })}>
            <option value="">Select company</option>
            {companyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm" value={line.remarks} placeholder="Remarks" onChange={(e) => update(index, { remarks: e.target.value })} />
          <button type="button" onClick={() => setLines((rows) => rows.filter((_, i) => i !== index))} className="rounded px-2 text-sm text-red-700 hover:bg-red-50">Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => setLines((rows) => [...rows, { role: "Owner", company_id: "", remarks: "" }])} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800">+ Add relationship</button>
    </div>
  );
}

export function BuildingRelationshipsView({ value, companyOptions }: { value: unknown; companyOptions: CompanyV1SelectOption[] }) {
  const lines = normalizeBuildingRelationships(value);
  const labels = useMemo(() => new Map(companyOptions.map((option) => [option.value, option.label])), [companyOptions]);
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">Role</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Remarks</th></tr></thead>
        <tbody>{lines.map((line, index) => <tr key={`${line.role}-${line.company_id}-${index}`} className="border-t border-slate-100"><td className="px-3 py-2 font-medium">{line.role}</td><td className="px-3 py-2">{labels.get(line.company_id) ?? line.company_id}</td><td className="px-3 py-2">{line.remarks}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
