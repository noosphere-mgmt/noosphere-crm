import { redirect } from "next/navigation";
import { getContactTab } from "@/lib/contactDetailTab";
import { resolveContactQueryParam } from "@/lib/contactDrawerResolve";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; mode?: string }>;
};

export default async function ContactDetailRedirectPage({ params, searchParams }: Props) {
  const { id: idRaw } = await params;
  const sp = await searchParams;
  const resolved = await resolveContactQueryParam(idRaw);
  if (!resolved) redirect("/admin/contacts");
  if (resolved.kind === "company_mismatch") {
    redirect(`/admin/companies?company=${encodeURIComponent(resolved.companyQuery)}`);
  }

  const tab = getContactTab(sp);
  const qs = new URLSearchParams();
  qs.set("contact", String(resolved.legacyContactId));
  if (tab !== "overview") qs.set("tab", tab);
  if (sp.mode === "edit") qs.set("mode", "edit");

  redirect(`/admin/contacts?${qs.toString()}`);
}
