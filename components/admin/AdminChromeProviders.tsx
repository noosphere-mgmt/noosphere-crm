"use client";

import type { ReactNode } from "react";
import { AdminRecordEditProvider } from "@/components/admin/AdminRecordEditContext";

/** Client chrome providers that must wrap admin pages (edit session, etc.). */
export function AdminChromeProviders({ children }: { children: ReactNode }) {
  return <AdminRecordEditProvider>{children}</AdminRecordEditProvider>;
}
