import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ActivityDetailPageClient } from "@/components/admin/activities/ActivityDetailPageClient";
import { getActivity } from "@/lib/repos/activities";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ActivityDetailPage({ params }: Props) {
  const { id: idRaw } = await params;
  const activity = await getActivity(idRaw.trim());
  if (!activity) notFound();

  return (
    <AdminShell title="" wide module="activities" hideHeader>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
        <ActivityDetailPageClient activity={activity} />
      </Suspense>
    </AdminShell>
  );
}
