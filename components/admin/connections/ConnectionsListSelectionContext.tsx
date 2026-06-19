"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type ConnectionsListSelectionContextValue = {
  selected: Set<string>;
  toggleOne: (id: string) => void;
  toggleAll: (ids: string[], selectAll: boolean) => void;
  selectedCount: number;
  someSelected: boolean;
};

const ConnectionsListSelectionContext = createContext<ConnectionsListSelectionContextValue | null>(null);

export function ConnectionsListSelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const value = useMemo<ConnectionsListSelectionContextValue>(
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
    <ConnectionsListSelectionContext.Provider value={value}>{children}</ConnectionsListSelectionContext.Provider>
  );
}

export function useConnectionsListSelection(): ConnectionsListSelectionContextValue {
  const ctx = useContext(ConnectionsListSelectionContext);
  if (!ctx) {
    throw new Error("useConnectionsListSelection must be used within ConnectionsListSelectionProvider");
  }
  return ctx;
}
