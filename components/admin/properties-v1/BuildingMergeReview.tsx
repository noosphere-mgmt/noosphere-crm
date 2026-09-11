"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mergeBuildingsAction } from "@/app/admin/properties/mergeActions";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import {
  buildingDisplayName,
  isCompanyMergeField,
  type BuildingMergeFieldChoices,
  type BuildingMergeFieldKey,
} from "@/lib/buildingMergeFields";
import { sumMergeImpact, type BuildingMergePreview } from "@/lib/buildingMergeImpact";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { PropertyV1SelectOption } from "@/lib/repos/propertiesV1";

const IMPACT_ITEMS = [
  { key: "companies", label: "Companies" },
  { key: "opportunities", label: "Opportunities" },
  { key: "activities", label: "Activities" },
  { key: "occupants", label: "Occupants" },
  { key: "leaseRecords", label: "Lease records" },
  { key: "relationshipLines", label: "Building relationships" },
] as const;

function companyLabel(companies: CompanyV1Option[], id: unknown): string {
  const raw = String(id ?? "").trim();
  if (!raw) return "—";
  const match = companies.find(
    (company) => company.company_id === raw || company.business_id === raw,
  );
  return match?.company_name_en?.trim() || match?.business_id || raw;
}

function displayValue(
  key: BuildingMergeFieldKey,
  value: unknown,
  companies: CompanyV1Option[],
): string {
  if (value == null || String(value).trim() === "") return "—";
  if (isCompanyMergeField(key)) return companyLabel(companies, value);
  return String(value);
}

function optionHaystack(option: PropertyV1SelectOption): string {
  return [
    option.label,
    option.name_en,
    option.name_zh,
    option.name_cn,
    option.full_address,
    option.district,
    option.city,
    option.business_id,
    option.property_id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function BuildingMergeNeedsPartner({
  existingId,
  propertyOptions,
}: {
  existingId: string | null;
  propertyOptions: PropertyV1SelectOption[];
}) {
  const router = useRouter();
  const theme = moduleAccentClasses("properties");
  const [addQuery, setAddQuery] = useState("");
  const current = propertyOptions.find(
    (option) => option.property_id === existingId || option.business_id === existingId,
  );
  const candidates = useMemo(() => {
    const needle = addQuery.trim().toLowerCase();
    return propertyOptions
      .filter((option) => option.property_id !== current?.property_id)
      .filter((option) => !needle || optionHaystack(option).includes(needle))
      .slice(0, 12);
  }, [addQuery, current?.property_id, propertyOptions]);

  function addBuilding(option: PropertyV1SelectOption) {
    const ids = [current?.business_id || existingId, option.business_id || option.property_id].filter(Boolean) as string[];
    router.push(`/admin/properties/buildings/merge?ids=${ids.map(encodeURIComponent).join(",")}`);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold text-slate-900">Building merge review</h1>
      {current ? (
        <p className="mt-2 text-sm text-slate-600">
          Starting from <span className="font-semibold">{current.label}</span>. Add at least one more building to compare fields.
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-600">
          Select two or more buildings on the Buildings listing, then click Merge.
        </p>
      )}
      {current ? (
        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Add another building
          </label>
          <input
            type="search"
            value={addQuery}
            onChange={(event) => setAddQuery(event.target.value)}
            placeholder="Search name, address, district, or ID"
            className={`mt-1 ${theme.searchInput}`}
          />
          <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-200">
            {candidates.map((option) => (
              <button
                key={option.property_id}
                type="button"
                onClick={() => addBuilding(option)}
                className="block w-full border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
              >
                <span className="block text-sm font-medium text-slate-900">{option.label}</span>
                <span className="block text-xs text-slate-500">
                  {[option.full_address, option.business_id].filter(Boolean).join(" · ")}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <Link
          href="/admin/properties/buildings"
          className="mt-4 inline-flex rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800"
        >
          Open Buildings listing
        </Link>
      )}
    </div>
  );
}

export function BuildingMergeReview({
  preview,
  companies,
}: {
  preview: BuildingMergePreview;
  companies: CompanyV1Option[];
}) {
  const router = useRouter();
  const theme = moduleAccentClasses("properties");
  const [survivorId, setSurvivorId] = useState(preview.defaultSurvivorId);
  const [choices, setChoices] = useState<BuildingMergeFieldChoices>(() => {
    const next: BuildingMergeFieldChoices = {};
    for (const field of preview.fields) next[field.key] = field.defaultSourceId;
    return next;
  });
  const [error, setError] = useState<string | null>(null);
  const [isMerging, startMerge] = useTransition();

  const buildings = preview.buildings;
  const propertyIds = buildings.map((item) => item.property.property_id);
  const fieldRows = preview.fields;
  const comparisonFields = useMemo(() => {
    const rank = (field: (typeof fieldRows)[number]) => {
      if (field.conflict) return 0;
      if (!field.identical) return 1;
      if (!field.allEmpty) return 2;
      return 3;
    };
    return [...fieldRows].sort((a, b) => rank(a) - rank(b));
  }, [fieldRows]);
  const archiveCount = Math.max(0, buildings.length - 1);
  const premisesAfter = buildings.reduce((sum, item) => sum + item.impact.premises, 0);
  const archiveImpact = sumMergeImpact(
    buildings.filter((item) => item.property.property_id !== survivorId).map((item) => item.impact),
  );
  const survivor = buildings.find((item) => item.property.property_id === survivorId)?.property;

  function setChoice(key: BuildingMergeFieldKey, sourceId: string) {
    setChoices((current) => ({ ...current, [key]: sourceId }));
  }

  function onMerge() {
    if (!survivor) return;
    setError(null);
    startMerge(async () => {
      const result = await mergeBuildingsAction({
        propertyIds,
        survivorPropertyId: survivorId,
        fieldChoices: choices,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.data.href);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Building merge review</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {buildings.length} building{buildings.length === 1 ? "" : "s"} selected
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Choose the surviving Building ID and the value that should remain for each field. Linked Premises and relationships move to the surviving record.
          </p>
        </div>
        <button type="button" onClick={() => router.push("/admin/properties/buildings")} className={theme.secondaryButton}>
          Cancel
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Surviving record</h2>
        <p className="mt-1 text-xs text-slate-500">
          This Building keeps its ID. Field values below are chosen separately and overwrite the surviving record.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {buildings.map((item) => {
            const selected = item.property.property_id === survivorId;
            return (
              <label
                key={item.property.property_id}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 ${
                  selected ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="survivor"
                  checked={selected}
                  onChange={() => setSurvivorId(item.property.property_id)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{buildingDisplayName(item.property)}</span>
                  <span className="block text-xs text-slate-500">
                    {item.property.business_id || item.property.property_id} · {item.impact.premises} premises
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Field comparison</h2>
          <p className="mt-1 text-xs text-slate-500">
            The selected value for each field is stored on the surviving Building. A populated value is preferred over blank unless you explicitly choose blank.
          </p>
        </div>
        <div className="max-h-[min(70vh,42rem)] max-w-full overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="sticky left-0 top-0 z-30 min-w-[10rem] bg-slate-50 px-3 py-2 font-semibold">Field</th>
                {buildings.map((item) => (
                  <th key={item.property.property_id} className="sticky top-0 z-20 min-w-[14rem] bg-slate-50 px-3 py-2 font-semibold text-slate-700">
                    <span className="block normal-case tracking-normal">{buildingDisplayName(item.property)}</span>
                    <span className="mt-0.5 block font-normal normal-case text-slate-500">
                      {item.property.business_id || item.property.property_id}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonFields.map((field) => {
                const selectedSource = choices[field.key] ?? field.defaultSourceId;
                return (
                  <tr key={field.key} className="border-t border-slate-100">
                    <th className="sticky left-0 bg-white px-3 py-2 align-top text-xs font-semibold text-slate-700">
                      {field.label}
                      {field.conflict ? (
                        <span className="ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                          conflict
                        </span>
                      ) : null}
                    </th>
                    {field.cells.map((cell) => {
                      const selected = selectedSource === cell.propertyId;
                      if (field.identical) {
                        return (
                          <td key={cell.propertyId} className="px-3 py-2 align-top text-slate-600">
                            {displayValue(field.key, cell.value, companies)}
                          </td>
                        );
                      }
                      return (
                        <td
                          key={cell.propertyId}
                          className={`px-3 py-2 align-top ${selected ? "bg-sky-50" : ""}`}
                        >
                          <label className="flex cursor-pointer items-start gap-2">
                            <input
                              type="radio"
                              name={`field-${field.key}`}
                              checked={selected}
                              onChange={() => setChoice(field.key, cell.propertyId)}
                              className="mt-0.5"
                            />
                            <span className={`text-sm ${selected ? "font-medium text-slate-900" : "text-slate-600"}`}>
                              {displayValue(field.key, cell.value, companies)}
                            </span>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Merge result</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Surviving Building</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {survivor ? `${buildingDisplayName(survivor)} · ${survivor.business_id || survivor.property_id}` : "—"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Records being archived: <span className="font-semibold tabular-nums text-slate-900">{archiveCount}</span>
            </p>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {buildings.map((item) => (
                  <tr key={item.property.property_id} className="border-t border-slate-100">
                    <td className="py-1.5 text-slate-700">{buildingDisplayName(item.property)}</td>
                    <td className="py-1.5 text-right tabular-nums text-slate-900">{item.impact.premises} premises</td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200">
                  <td className="py-1.5 font-semibold text-slate-900">After merge</td>
                  <td className="py-1.5 text-right font-semibold tabular-nums text-slate-900">{premisesAfter} premises</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Other relationships moving</p>
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {IMPACT_ITEMS.map((item) => (
                <li key={item.key} className="rounded-lg border border-slate-200 px-2.5 py-2">
                  <p className="text-lg font-semibold tabular-nums text-slate-900">{archiveImpact[item.key]}</p>
                  <p className="text-[11px] text-slate-500">{item.label}</p>
                </li>
              ))}
            </ul>
            {preview.addedRelationshipLines > 0 ? (
              <p className="mt-2 text-xs text-slate-600">
                {preview.addedRelationshipLines} additional building relationship
                {preview.addedRelationshipLines === 1 ? "" : "s"} will be added without duplicating existing company roles.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => router.push("/admin/properties/buildings")} className={theme.secondaryButton} disabled={isMerging}>
          Cancel
        </button>
        <button
          type="button"
          onClick={onMerge}
          disabled={isMerging || buildings.length < 2}
          className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isMerging ? "Merging…" : "Merge Buildings"}
        </button>
      </div>
    </div>
  );
}
