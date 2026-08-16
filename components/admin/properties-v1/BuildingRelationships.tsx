"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BUILDING_RELATIONSHIP_ROLES,
  normalizeBuildingRelationships,
  type BuildingRelationshipLine,
} from "@/lib/buildingRelationships";
import type { CompanyV1SelectOption } from "@/lib/companyV1Display";

export function BuildingRelationshipsEditor({
  value,
  companyOptions,
  onSave,
}: {
  value: unknown;
  companyOptions: CompanyV1SelectOption[];
  /** When set, each structural change is persisted (inline overview). Form mode omits this. */
  onSave?: (lines: BuildingRelationshipLine[]) => Promise<{ ok: boolean; error?: string }>;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<BuildingRelationshipLine[]>(() => normalizeBuildingRelationships(value));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLines(normalizeBuildingRelationships(value));
  }, [value]);

  function persist(next: BuildingRelationshipLine[]) {
    setLines(next);
    if (!onSave) return;
    setError(null);
    startTransition(async () => {
      const result = await onSave(next);
      if (!result.ok) {
        setError(result.error ?? "Could not save relationships");
        setLines(normalizeBuildingRelationships(value));
        return;
      }
      router.refresh();
    });
  }

  function updateLocal(index: number, patch: Partial<BuildingRelationshipLine>) {
    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function updateAndPersist(index: number, patch: Partial<BuildingRelationshipLine>) {
    const next = lines.map((row, i) => (i === index ? { ...row, ...patch } : row));
    persist(next);
  }

  return (
    <div className="space-y-2">
      {!onSave ? (
        <input type="hidden" name="building_relationship_lines" value={JSON.stringify(lines)} />
      ) : null}
      {lines.map((line, index) => (
        <div
          key={`${index}-${line.role}`}
          className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2 sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_auto]"
        >
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
            value={line.role}
            disabled={pending}
            onChange={(e) => {
              const role = e.target.value as BuildingRelationshipLine["role"];
              if (onSave) updateAndPersist(index, { role });
              else updateLocal(index, { role });
            }}
          >
            {BUILDING_RELATIONSHIP_ROLES.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
            value={line.company_id}
            disabled={pending}
            onChange={(e) => {
              const company_id = e.target.value;
              if (onSave) updateAndPersist(index, { company_id });
              else updateLocal(index, { company_id });
            }}
          >
            <option value="">Select company</option>
            {companyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
            value={line.remarks}
            placeholder="Remarks"
            disabled={pending}
            onChange={(e) => updateLocal(index, { remarks: e.target.value })}
            onBlur={(e) => {
              const remarks = e.target.value;
              if (!onSave) return;
              if (remarks === (normalizeBuildingRelationships(value)[index]?.remarks ?? line.remarks)) return;
              updateAndPersist(index, { remarks });
            }}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => persist(lines.filter((_, i) => i !== index))}
            className="rounded px-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={pending}
        onClick={() => persist([...lines, { role: "Owner/Landlord", company_id: "", remarks: "" }])}
        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800 disabled:opacity-50"
      >
        + Add relationship
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

export function BuildingRelationshipsView({
  value,
  companyOptions,
}: {
  value: unknown;
  companyOptions: CompanyV1SelectOption[];
}) {
  const lines = normalizeBuildingRelationships(value);
  const labels = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of companyOptions) {
      map.set(option.value, option.label);
      map.set(option.businessId, option.label);
      map.set(option.v1Id, option.label);
      if (option.legacyId != null) map.set(String(option.legacyId), option.label);
    }
    return map;
  }, [companyOptions]);

  if (lines.length === 0) {
    return <p className="text-sm text-slate-500">No relationships yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Company</th>
            <th className="px-3 py-2">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={`${line.role}-${line.company_id}-${index}`} className="border-t border-slate-100">
              <td className="px-3 py-2 font-medium">{line.role}</td>
              <td className="px-3 py-2">{labels.get(line.company_id) ?? line.company_id}</td>
              <td className="px-3 py-2">{line.remarks || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
