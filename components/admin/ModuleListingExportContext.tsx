"use client";

import { arraysEqual } from "@/lib/arraysEqual";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ModuleListingExportContextValue = {
  filteredIds: string[];
  setFilteredIds: (ids: string[]) => void;
};

const ModuleListingExportContext = createContext<ModuleListingExportContextValue | null>(null);

export function ModuleListingExportProvider({ children }: { children: ReactNode }) {
  const [filteredIds, setFilteredIdsState] = useState<string[]>([]);

  const setFilteredIds = useCallback((next: string[]) => {
    setFilteredIdsState((prev) => (arraysEqual(prev, next) ? prev : next));
  }, []);

  const value = useMemo(
    () => ({ filteredIds, setFilteredIds }),
    [filteredIds, setFilteredIds],
  );

  return (
    <ModuleListingExportContext.Provider value={value}>{children}</ModuleListingExportContext.Provider>
  );
}

export function useModuleListingExport(): ModuleListingExportContextValue {
  const ctx = useContext(ModuleListingExportContext);
  if (!ctx) {
    throw new Error("useModuleListingExport must be used within ModuleListingExportProvider");
  }
  return ctx;
}

export function useOptionalModuleListingExport(): ModuleListingExportContextValue | null {
  return useContext(ModuleListingExportContext);
}

/** Sync filtered row IDs from a list client into export context. */
export function useSyncListingExportIds(ids: string[]): void {
  const { setFilteredIds } = useModuleListingExport();
  const idsKey = useMemo(() => ids.join("|"), [ids]);

  useEffect(() => {
    setFilteredIds(ids);
    // idsKey tracks content; omit ids reference to avoid spurious re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ids synced via idsKey
  }, [idsKey, setFilteredIds]);
}
