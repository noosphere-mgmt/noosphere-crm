"use client";

import { useEffect } from "react";
import type { ImportObjectType } from "@/lib/import/types";
import { IMPORT_OBJECT_TYPES } from "@/lib/import/types";

export function ImportWorkbenchFocus({ objectType }: { objectType: string | undefined }) {
  useEffect(() => {
    if (!objectType || !IMPORT_OBJECT_TYPES.includes(objectType as ImportObjectType)) return;
    const el = document.getElementById(`import-${objectType}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [objectType]);

  return null;
}
