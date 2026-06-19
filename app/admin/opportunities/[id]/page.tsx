import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { OpportunityDetailPageClient } from "@/components/admin/opportunities/OpportunityDetailPageClient";
import { getOpportunityDetailData } from "@/lib/repos/opportunityDetail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function OpportunityDetailPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const data = await getOpportunityDetailData(id);
  if (!data) notFound();

  return (
    <AdminShell title={data.opportunity.client_name} module="opportunities" wide hideHeader>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
        <OpportunityDetailPageClient data={data} />
      </Suspense>
    </AdminShell>
  );
}
