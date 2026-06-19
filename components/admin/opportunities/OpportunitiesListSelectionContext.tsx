"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type OpportunitiesListSelectionContextValue = {
  selected: Set<string>;
  toggleOne: (id: string) => void;
  toggleAll: (ids: string[], selectAll: boolean) => void;
  selectedCount: number;
  someSelected: boolean;
};

const OpportunitiesListSelectionContext = createContext<OpportunitiesListSelectionContextValue | null>(null);

export function OpportunitiesListSelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const value = useMemo<OpportunitiesListSelectionContextValue>(
    () => ({
      selected,
      selectedCount: selected.size,
      someSelected: selected.size > 0,
      toggleOne: (id: string) => {
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      },
      toggleAll: (ids: string[], selectAll: boolean) => {
        setSelected((prev) => {
          const next = new Set(prev);
          if (selectAll) ids.forEach((id) => next.add(id));
          else ids.forEach((id) => next.delete(id));
          return next;
        });
      },
    }),
    [selected],
  );

  return (
    <OpportunitiesListSelectionContext.Provider value={value}>
      {children}
    </OpportunitiesListSelectionContext.Provider>
  );
}

export function useOpportunitiesListSelection(): OpportunitiesListSelectionContextValue {
  const ctx = useContext(OpportunitiesListSelectionContext);
  if (!ctx) {
    throw new Error("useOpportunitiesListSelection must be used within OpportunitiesListSelectionProvider");
  }
  return ctx;
}

