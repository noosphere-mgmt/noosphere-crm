"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BUILDING_WORKSPACE_TABS, getBuildingWorkspaceTab } from "@/lib/buildingWorkspaceTab";
import { buildingWorkspaceHref } from "@/lib/buildingWorkspaceNav";
import type { PropertyV1 } from "@/lib/repos/propertiesV1";

const tabClasses = {
  overview: {
    active: "border-blue-600 bg-blue-600 text-white",
    idle: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
  },
  premises: {
    active: "border-emerald-600 bg-emerald-600 text-white",
    idle: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  },
  proposal: {
    active: "border-rose-500 bg-rose-500 text-white",
    idle: "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100",
  },
  activities: {
    active: "border-violet-600 bg-violet-600 text-white",
    idle: "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100",
  },
} as const;

export function BuildingWorkspaceTabs({
  property,
  premisesCount,
}: {
  property: PropertyV1;
  premisesCount: number;
}) {
  const searchParams = useSearchParams();
  const active = getBuildingWorkspaceTab({ tab: searchParams.get("tab") });

  return (
    <nav className="flex gap-2 pb-1" aria-label="Building workspace sections">
      {BUILDING_WORKSPACE_TABS.map((tab) => {
        const isActive = active === tab.id;
        const href = buildingWorkspaceHref(property, tab.id);
        const count = tab.id === "premises" ? premisesCount : 0;
        return (
          <Link
            key={tab.id}
            href={href}
            className={`whitespace-nowrap rounded-t-lg border px-3.5 py-2 text-sm font-semibold shadow-sm transition ${isActive ? tabClasses[tab.id].active : tabClasses[tab.id].idle}`}
          >
            {tab.id === "premises" ? `${tab.label} (${count})` : tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
