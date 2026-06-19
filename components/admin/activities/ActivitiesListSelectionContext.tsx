"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ActivitiesListSelectionContextValue = {
  selected: Set<string>;
  toggleOne: (id: string) => void;
  toggleAll: (ids: string[], select: boolean) => void;
  selectedCount: number;
  someSelected: boolean;
  clearSelection: () => void;
};

const ActivitiesListSelectionContext = createContext<ActivitiesListSelectionContextValue | null>(null);

export function ActivitiesListSelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[], select: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (select) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const value = useMemo(
    () => ({
      selected,
      toggleOne,
      toggleAll,
      selectedCount: selected.size,
      someSelected: selected.size > 0,
      clearSelection,
    }),
    [selected, toggleOne, toggleAll, clearSelection],
  );

  return (
    <ActivitiesListSelectionContext.Provider value={value}>{children}</ActivitiesListSelectionContext.Provider>
  );
}

export function useActivitiesListSelection(): ActivitiesListSelectionContextValue {
  const ctx = useContext(ActivitiesListSelectionContext);
  if (!ctx) throw new Error("useActivitiesListSelection must be used within ActivitiesListSelectionProvider");
  return ctx;
}
