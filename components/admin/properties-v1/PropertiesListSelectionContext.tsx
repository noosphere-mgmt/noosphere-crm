"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type PropertiesListSelectionContextValue = {
  selected: Set<string>;
  toggleOne: (id: string) => void;
  toggleAll: (ids: string[], selectAll: boolean) => void;
  selectedCount: number;
  someSelected: boolean;
};

const PropertiesListSelectionContext = createContext<PropertiesListSelectionContextValue | null>(null);

export function PropertiesListSelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const value = useMemo<PropertiesListSelectionContextValue>(
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
    <PropertiesListSelectionContext.Provider value={value}>{children}</PropertiesListSelectionContext.Provider>
  );
}

export function usePropertiesListSelection(): PropertiesListSelectionContextValue {
  const ctx = useContext(PropertiesListSelectionContext);
  if (!ctx) {
    throw new Error("usePropertiesListSelection must be used within PropertiesListSelectionProvider");
  }
  return ctx;
}
