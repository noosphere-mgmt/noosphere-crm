"use client";

import type { ReactNode } from "react";

export type SortDir = "asc" | "desc";

/** Null-safe text compare for list sorting. */
export function compareSortText(a: string | null | undefined, b: string | null | undefined, dir: SortDir): number {
  const cmp = String(a ?? "").localeCompare(String(b ?? ""), undefined, { sensitivity: "base" });
  return dir === "asc" ? cmp : -cmp;
}

export function nextSortState<K extends string>(
  currentKey: K,
  currentDir: SortDir,
  nextKey: K,
  defaultDirForKey: (key: K) => SortDir = () => "asc",
): { sortKey: K; sortDir: SortDir } {
  if (currentKey === nextKey) {
    return { sortKey: currentKey, sortDir: currentDir === "asc" ? "desc" : "asc" };
  }
  return { sortKey: nextKey, sortDir: defaultDirForKey(nextKey) };
}

export function SortableTableHeader<K extends string>({
  label,
  sortKey,
  activeKey,
  sortDir,
  onSort,
  className = "",
  children,
}: {
  label: string;
  sortKey: K;
  activeKey: K;
  sortDir: SortDir;
  onSort: (key: K) => void;
  className?: string;
  /** Optional content under the title (e.g. column filter). */
  children?: ReactNode;
}) {
  const active = activeKey === sortKey;
  const indicator = active ? (sortDir === "asc" ? "↑" : "↓") : "↕";

  return (
    <th className={`px-3 py-1.5 align-top font-medium ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSort(sortKey);
        }}
        className={`inline-flex w-full items-center gap-1 text-left transition hover:text-slate-900 ${
          active ? "text-slate-900" : "text-slate-600"
        }`}
        aria-label={`Sort by ${label}`}
        title={`Sort by ${label}`}
      >
        <span className="min-w-0 flex-1">{label}</span>
        <span
          className={`shrink-0 text-[10px] font-semibold ${active ? "text-slate-700" : "text-slate-400"}`}
          aria-hidden
        >
          {indicator}
        </span>
      </button>
      {children}
    </th>
  );
}
