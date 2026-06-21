import { redirect } from "next/navigation";
import { getCompanyTab } from "@/lib/companyDetailTab";
import { resolveLegacyCompanyIdFromQuery } from "@/lib/companyDrawerResolve";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; mode?: string; add_contact?: string }>;
};

export default async function CompanyDetailRedirectPage({ params, searchParams }: Props) {
  const { id: idRaw } = await params;
  const sp = await searchParams;
  const legacyCompanyId = await resolveLegacyCompanyIdFromQuery(idRaw);
  if (legacyCompanyId == null) redirect("/admin/companies");

  const tab = getCompanyTab(sp);
  const qs = new URLSearchParams();
  qs.set("company", String(legacyCompanyId));
  if (tab !== "overview") qs.set("tab", tab);
  if (sp.mode === "edit" || sp.mode === "full") qs.set("mode", sp.mode);
  if (sp.add_contact === "1") qs.set("add_contact", "1");

  redirect(`/admin/companies?${qs.toString()}`);
}
