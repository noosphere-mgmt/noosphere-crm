import { AdminShell } from "@/components/admin/AdminShell";
import { DashboardV2 } from "@/components/admin/dashboard/DashboardV2";
import { fetchDashboardData } from "@/lib/repos/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let data: Awaited<ReturnType<typeof fetchDashboardData>> | null = null;
  let error: string | null = null;

  try {
    data = await fetchDashboardData();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load dashboard";
  }

  return (
    <AdminShell
      title="Dashboard"
      module="dashboard"
      wide
    >
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-900">
          <p className="font-semibold">Dashboard unavailable</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-red-800">If tables are missing, run <code className="rounded bg-red-100 px-1">npm run db:migrate</code>.</p>
        </div>
      ) : data ? (
        <DashboardV2 data={data} />
      ) : null}
    </AdminShell>
  );
}
