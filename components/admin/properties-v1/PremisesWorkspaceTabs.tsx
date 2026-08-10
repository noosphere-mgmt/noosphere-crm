"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PREMISES_WORKSPACE_TABS, getPremisesWorkspaceTab } from "@/lib/premisesWorkspaceTab";
import { premisesWorkspaceHref } from "@/lib/premisesWorkspaceNav";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

const tabClasses: Record<string, { active: string; idle: string }> = {
  overview: { active: "border-blue-600 bg-blue-600 text-white", idle: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100" },
  relationships: { active: "border-violet-600 bg-violet-600 text-white", idle: "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100" },
  deals: { active: "border-rose-500 bg-rose-500 text-white", idle: "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100" },
  activities: { active: "border-indigo-600 bg-indigo-600 text-white", idle: "border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100" },
};

export function PremisesWorkspaceTabs({
  premises,
  counts,
  returnTo,
}: {
  premises: PremisesV1;
  counts?: { relationships?: number; deals?: number };
  returnTo: string;
}) {
  const searchParams = useSearchParams();
  const active = getPremisesWorkspaceTab({ tab: searchParams.get("tab") });

  return (
    <nav className="flex gap-2 pb-1" aria-label="Premises workspace sections">
      {PREMISES_WORKSPACE_TABS.map((tab) => {
        const isActive = active === tab.id;
        const href = premisesWorkspaceHref(premises, tab.id, undefined, returnTo);
        const count =
          tab.id === "relationships"
            ? counts?.relationships ?? 0
            : tab.id === "deals"
              ? counts?.deals ?? 0
              : 0;
        return (
          <Link
            key={tab.id}
            href={href}
            className={`whitespace-nowrap rounded-t-lg border px-3 py-2 text-sm font-semibold shadow-sm transition ${isActive ? tabClasses[tab.id]!.active : tabClasses[tab.id]!.idle}`}
          >
            {tab.id === "relationships" || tab.id === "deals" ? `${tab.label} (${count})` : tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
