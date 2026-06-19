"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { searchActivityLinkAction } from "@/app/admin/activities/actions";
import type { ActivityLinkSearchHit } from "@/lib/repos/activities";

const inputClass =
  "w-full rounded-lg border border-amber-200/80 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100";

export function ActivityPremisesMultiPicker({
  value,
  onChange,
  disabled,
}: {
  value: ActivityLinkSearchHit[];
  onChange: (hits: ActivityLinkSearchHit[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ActivityLinkSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [pending, startTransition] = useTransition();

  const syncMenuPosition = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) {
      setHits([]);
      return;
    }
    syncMenuPosition();
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const results = await searchActivityLinkAction("premises", query.trim(), 25);
        const selected = new Set(value.map((v) => v.entity_id));
        setHits(results.filter((h) => !selected.has(h.entity_id)));
      });
    }, query.trim() ? 180 : 0);
    return () => window.clearTimeout(timer);
  }, [query, open, value, syncMenuPosition]);

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

  function addHit(hit: ActivityLinkSearchHit) {
    onChange([...value, hit]);
    setQuery("");
    inputRef.current?.focus();
  }

  function removeHit(id: string) {
    onChange(value.filter((h) => h.entity_id !== id));
  }

  const menu =
    open && menuRect && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            className="overflow-hidden rounded-lg border border-amber-200 bg-white shadow-lg"
            style={{
              position: "fixed",
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
              zIndex: 80,
            }}
          >
            <ul className="max-h-[min(360px,50vh)] overflow-y-auto py-1">
              {pending ? (
                <li className="px-3 py-3 text-sm text-slate-500">Searching…</li>
              ) : hits.length === 0 ? (
                <li className="px-3 py-3 text-sm text-slate-500">No premises found</li>
              ) : (
                hits.map((hit) => (
                  <li key={hit.entity_id}>
                    <button
                      type="button"
                      className="block w-full px-3 py-2.5 text-left hover:bg-amber-50"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addHit(hit)}
                    >
                      <span className="block text-sm font-medium leading-snug text-slate-900">{hit.label}</span>
                      {hit.subtitle ? (
                        <span className="mt-0.5 block text-xs leading-snug text-slate-500">{hit.subtitle}</span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="block w-full text-sm">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">Linked Premises / Checkpoints</span>
      {value.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {value.map((hit) => (
            <li
              key={hit.entity_id}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-950"
            >
              <span className="truncate">{hit.label}</span>
              <button
                type="button"
                disabled={disabled}
                className="shrink-0 text-amber-800 hover:text-amber-950"
                onClick={() => removeHit(hit.entity_id)}
                aria-label={`Remove ${hit.label}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            syncMenuPosition();
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 200)}
          className={inputClass}
          placeholder="Search building, floor, unit, district, operator…"
        />
      </div>
      {menu}
    </div>
  );
}
