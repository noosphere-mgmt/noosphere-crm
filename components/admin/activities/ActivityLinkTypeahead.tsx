"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { searchActivityLinkAction } from "@/app/admin/activities/actions";
import type { ActivityLinkSearchHit } from "@/lib/repos/activities";

export function ActivityLinkTypeahead({
  label,
  entityType,
  value,
  onChange,
  disabled,
}: {
  label: string;
  entityType: ActivityLinkSearchHit["entity_type"];
  value: ActivityLinkSearchHit | null;
  onChange: (hit: ActivityLinkSearchHit | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(value?.label ?? "");
  const [hits, setHits] = useState<ActivityLinkSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setQuery(value?.label ?? "");
  }, [value?.label, entityType]);

  const syncMenuPosition = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!open) {
      setHits([]);
      return;
    }
    syncMenuPosition();
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const results = await searchActivityLinkAction(entityType, query.trim());
        setHits(results);
      });
    }, query.trim() ? 200 : 0);
    return () => window.clearTimeout(timer);
  }, [query, open, entityType, syncMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => syncMenuPosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, syncMenuPosition]);

  function selectHit(hit: ActivityLinkSearchHit) {
    onChange(hit);
    setQuery(hit.label);
    setOpen(false);
  }

  const menu =
    open && menuRect && typeof document !== "undefined"
      ? createPortal(
          <ul
            className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            style={{
              position: "fixed",
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
              zIndex: 80,
            }}
          >
            {hits.length === 0 && !pending ? (
              <li className="px-3 py-2 text-sm text-slate-500">No matches — try another search</li>
            ) : (
              hits.map((hit) => (
                <li key={`${hit.entity_type}-${hit.entity_id}`}>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-amber-50"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectHit(hit)}
                  >
                    <span className="font-medium text-slate-900">{hit.label}</span>
                    {hit.subtitle ? (
                      <span className="mt-0.5 block text-xs text-slate-500">{hit.subtitle}</span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>,
          document.body,
        )
      : null;

  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(null);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            syncMenuPosition();
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 200)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          placeholder={`Search ${label.toLowerCase()}…`}
        />
        {value ? (
          <button
            type="button"
            className="absolute right-2 top-2 text-xs text-slate-500 hover:text-slate-800"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
          >
            Clear
          </button>
        ) : null}
      </div>
      {pending ? <p className="mt-1 text-xs text-slate-400">Searching…</p> : null}
      {menu}
    </label>
  );
}
