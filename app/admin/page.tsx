import { AdminShell } from "@/components/admin/AdminShell";
import { DashboardV2 } from "@/components/admin/dashboard/DashboardV2";
import { fetchDashboardData } from "@/lib/repos/dashboard";
import { listOpportunities } from "@/lib/repos/opportunities";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let error: string | null = null;
  let viewData: Parameters<typeof DashboardV2>[0]["data"] | null = null;

  try {
    const [dashboard, deals] = await Promise.all([
      fetchDashboardData(),
      listOpportunities(),
    ]);
    viewData = { dashboard, deals };
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load dashboard";
  }

  return (
    <AdminShell title="Noosphere Intelligence" module="dashboard" wide hideHeader>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-900">
          <p className="font-semibold">Dashboard unavailable</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-red-800">
            If tables are missing, run <code className="rounded bg-red-100 px-1">npm run db:migrate</code>.
          </p>
        </div>
      ) : viewData ? (
        <DashboardV2 data={viewData} />
      ) : null}
    </AdminShell>
  );
}
