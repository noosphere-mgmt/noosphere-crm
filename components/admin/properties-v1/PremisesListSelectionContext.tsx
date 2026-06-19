"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type PremisesListSelectionContextValue = {
  selected: Set<string>;
  toggleOne: (id: string) => void;
  toggleAll: (ids: string[], selectAll: boolean) => void;
  clearSelection: () => void;
  selectedCount: number;
  someSelected: boolean;
};

const PremisesListSelectionContext = createContext<PremisesListSelectionContextValue | null>(null);

export function PremisesListSelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const value = useMemo<PremisesListSelectionContextValue>(
    () => ({
      selected,
      selectedCount: selected.size,
      someSelected: selected.size > 0,
      clearSelection,
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
    [selected, clearSelection],
  );

  return (
    <PremisesListSelectionContext.Provider value={value}>{children}</PremisesListSelectionContext.Provider>
  );
}

export function usePremisesListSelection(): PremisesListSelectionContextValue {
  const ctx = useContext(PremisesListSelectionContext);
  if (!ctx) {
    throw new Error("usePremisesListSelection must be used within PremisesListSelectionProvider");
  }
  return ctx;
}
