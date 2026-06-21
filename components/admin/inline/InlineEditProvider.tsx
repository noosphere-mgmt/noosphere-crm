"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { InlineSaveStatus } from "@/lib/types/inlineEdit";

type InlineEditContextValue = {
  editHighlight: boolean;
  setEditHighlight: (on: boolean) => void;
  saveStatus: InlineSaveStatus;
  saveError: string | null;
  runSave: (fn: () => Promise<{ ok: boolean; error?: string }>) => Promise<boolean>;
  retryLastSave: () => void;
};

const InlineEditContext = createContext<InlineEditContextValue | null>(null);

export function InlineEditProvider({
  children,
  initialEditHighlight = true,
  resetKey,
}: {
  children: ReactNode;
  /** When true, fields are clickable for inline edit. Drawers default to on. */
  initialEditHighlight?: boolean;
  /** Changing this remounts edit state (e.g. drawer record id). */
  resetKey?: string | number | null;
}) {
  const router = useRouter();
  const [editHighlight, setEditHighlight] = useState(initialEditHighlight);

  useEffect(() => {
    setEditHighlight(initialEditHighlight);
  }, [resetKey, initialEditHighlight]);
  const [saveStatus, setSaveStatus] = useState<InlineSaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSaveRef = useRef<(() => Promise<{ ok: boolean; error?: string }>) | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSave = useCallback(
    async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
      lastSaveRef.current = fn;
      setSaveStatus("saving");
      setSaveError(null);
      const result = await fn();
      if (result.ok) {
        setSaveStatus("saved");
        router.refresh();
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
        return true;
      }
      setSaveStatus("error");
      setSaveError(result.error ?? "Save failed");
      return false;
    },
    [router],
  );

  const retryLastSave = useCallback(() => {
    if (lastSaveRef.current) void runSave(lastSaveRef.current);
  }, [runSave]);

  const value = useMemo(
    () => ({
      editHighlight,
      setEditHighlight,
      saveStatus,
      saveError,
      runSave,
      retryLastSave,
    }),
    [editHighlight, saveStatus, saveError, runSave, retryLastSave],
  );

  return <InlineEditContext.Provider value={value}>{children}</InlineEditContext.Provider>;
}

export function useInlineEdit(): InlineEditContextValue {
  const ctx = useContext(InlineEditContext);
  if (!ctx) throw new Error("useInlineEdit must be used within InlineEditProvider");
  return ctx;
}
