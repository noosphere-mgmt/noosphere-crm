import { redirect } from "next/navigation";
import { getOpportunityTab } from "@/lib/opportunityDetailTab";
import { resolveOpportunityQueryParam } from "@/lib/opportunityDrawerResolve";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; mode?: string }>;
};

export default async function OpportunityDetailRedirectPage({ params, searchParams }: Props) {
  const { id: idRaw } = await params;
  const sp = await searchParams;
  const legacyId = await resolveOpportunityQueryParam(idRaw);
  if (!legacyId) redirect("/admin/opportunities");

  const tab = getOpportunityTab(sp);
  const qs = new URLSearchParams();
  qs.set("opportunity", String(legacyId));
  if (tab !== "overview") qs.set("tab", tab);
  if (sp.mode === "edit") qs.set("mode", "edit");

  redirect(`/admin/opportunities?${qs.toString()}`);
}
