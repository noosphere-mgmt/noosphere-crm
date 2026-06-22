"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "noosphere-opportunity-drawer-width-vw";
const DEFAULT_VW = 70;
const MIN_VW = 65;
const MAX_VW = 75;

export function useResizableDrawerWidth(storageKey = STORAGE_KEY) {
  const [widthVw, setWidthVw] = useState(DEFAULT_VW);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;
      const n = Number.parseFloat(stored);
      if (Number.isFinite(n)) setWidthVw(Math.min(MAX_VW, Math.max(MIN_VW, n)));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = widthVw;

      function onMove(ev: PointerEvent) {
        const deltaVw = ((startX - ev.clientX) / window.innerWidth) * 100;
        const next = Math.min(MAX_VW, Math.max(MIN_VW, startWidth + deltaVw));
        setWidthVw(next);
      }

      function onUp() {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        setWidthVw((current) => {
          try {
            localStorage.setItem(storageKey, String(Math.round(current * 10) / 10));
          } catch {
            /* ignore */
          }
          return current;
        });
      }

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [storageKey, widthVw],
  );

  return { widthVw, onResizePointerDown, minVw: MIN_VW, maxVw: MAX_VW };
}
