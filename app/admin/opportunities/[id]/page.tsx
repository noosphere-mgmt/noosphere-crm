import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { OpportunityWorkspacePageClient } from "@/components/admin/opportunities/OpportunityWorkspacePageClient";
import { isProposalsEnabled } from "@/lib/proposals/proposalEngine";
import { resolveOpportunityQueryParam } from "@/lib/opportunityDrawerResolve";
import { getOpportunityDetailData } from "@/lib/repos/opportunityDetail";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; mode?: string }>;
};

export default async function OpportunityDetailPage({ params }: Props) {
  const { id: idRaw } = await params;
  const legacyId = await resolveOpportunityQueryParam(idRaw);
  if (!legacyId) notFound();

  const data = await getOpportunityDetailData(legacyId);
  if (!data) notFound();

  return (
    <AdminShell title="" wide module="opportunities" hideHeader>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
        <OpportunityWorkspacePageClient data={data} proposalsEnabled={isProposalsEnabled()} />
      </Suspense>
    </AdminShell>
  );
}
