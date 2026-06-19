"use client";

import { useEffect, useState, useTransition } from "react";
import {
  searchRelationshipEntitiesAction,
} from "@/app/admin/connections/relationshipActions";
import type { RelationshipSearchHit } from "@/lib/repos/relationships";
import type { EntityType } from "@/lib/entityRelationships";

export function RelationshipEntityTypeahead({
  partyType,
  value,
  onChange,
  disabled,
}: {
  partyType: EntityType;
  value: RelationshipSearchHit | null;
  onChange: (hit: RelationshipSearchHit | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [hits, setHits] = useState<RelationshipSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setQuery(value?.label ?? "");
  }, [value?.label, partyType]);

  useEffect(() => {
    const term = query.trim();
    if (!open || term.length < 1) {
      setHits([]);
      return;
    }
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const result = await searchRelationshipEntitiesAction(partyType, term);
        if (result.ok) setHits(result.hits);
      });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query, open, partyType]);

  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        disabled={disabled}
        placeholder={partyType === "company" ? "Search companies…" : "Search contacts…"}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
      />
      {value ? (
        <button
          type="button"
          className="absolute right-2 top-2 text-xs text-slate-500 hover:text-slate-800"
          onClick={() => {
            onChange(null);
            setQuery("");
          }}
        >
          Clear
        </button>
      ) : null}
      {open && hits.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {hits.map((hit) => (
            <li key={`${hit.entity_type}-${hit.entity_id}`}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-violet-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(hit);
                  setQuery(hit.label);
                  setOpen(false);
                }}
              >
                <span className="font-medium text-slate-900">{hit.label}</span>
                {hit.subtitle ? (
                  <span className="mt-0.5 block text-xs text-slate-500">{hit.subtitle}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {pending ? <p className="mt-1 text-xs text-slate-400">Searching…</p> : null}
    </div>
  );
}
