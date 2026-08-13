"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AdminRecordEditContextValue = {
  editing: boolean;
  /** Register an active full-form edit surface; returns unregister. */
  registerEditSurface: () => () => void;
};

const AdminRecordEditContext = createContext<AdminRecordEditContextValue>({
  editing: false,
  registerEditSurface: () => () => undefined,
});

export function AdminRecordEditProvider({ children }: { children: ReactNode }) {
  const [activeCount, setActiveCount] = useState(0);

  const registerEditSurface = useCallback(() => {
    setActiveCount((n) => n + 1);
    return () => setActiveCount((n) => Math.max(0, n - 1));
  }, []);

  const value = useMemo(
    () => ({ editing: activeCount > 0, registerEditSurface }),
    [activeCount, registerEditSurface],
  );

  return <AdminRecordEditContext.Provider value={value}>{children}</AdminRecordEditContext.Provider>;
}

export function useAdminRecordEditing(): boolean {
  return useContext(AdminRecordEditContext).editing;
}

export function useRegisterAdminRecordEdit(active = true) {
  const { registerEditSurface } = useContext(AdminRecordEditContext);
  useEffect(() => {
    if (!active) return;
    return registerEditSurface();
  }, [active, registerEditSurface]);
}
