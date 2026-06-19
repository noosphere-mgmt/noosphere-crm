import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ActivitiesListClient } from "@/components/admin/activities/ActivitiesListClient";
import { ActivitiesListSelectionProvider } from "@/components/admin/activities/ActivitiesListSelectionContext";
import { ModuleListingExportProvider } from "@/components/admin/ModuleListingExportContext";
import { listActivities } from "@/lib/repos/activities";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ activity?: string }> };

export default async function ActivitiesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const rows = await listActivities();
  const initialActivityId = sp.activity?.trim() || undefined;

  return (
    <AdminShell title="Activities" module="activities" wide hideHeader>
      <ActivitiesListSelectionProvider>
        <ModuleListingExportProvider>
          <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
            <ActivitiesListClient rows={rows} initialActivityId={initialActivityId} />
          </Suspense>
        </ModuleListingExportProvider>
      </ActivitiesListSelectionProvider>
    </AdminShell>
  );
}
