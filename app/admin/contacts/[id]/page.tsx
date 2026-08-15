import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContactWorkspacePageClient } from "@/components/admin/connections/ContactWorkspacePageClient";
import { sanitizeAdminReturnTo } from "@/lib/adminReturnTo";
import { resolveContactQueryParam } from "@/lib/contactDrawerResolve";
import { classifyContactQueryParam } from "@/lib/entityRefGuards";
import { getContactDrawerData } from "@/lib/repos/connectionsDrawer";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; mode?: string; returnTo?: string }>;
};

export default async function ContactDetailPage({ params, searchParams }: Props) {
  const { id: idRaw } = await params;
  const sp = await searchParams;
  const returnTo = sanitizeAdminReturnTo(sp.returnTo, "/admin/contacts");

  const precheck = classifyContactQueryParam(idRaw);
  if (precheck?.kind === "company_mismatch") {
    redirect(`/admin/companies/${encodeURIComponent(precheck.redirectToCompany)}`);
  }

  const resolved = await resolveContactQueryParam(idRaw);
  if (!resolved) notFound();
  if (resolved.kind === "company_mismatch") {
    redirect(`/admin/companies/${encodeURIComponent(resolved.redirectToCompany)}`);
  }

  const data = await getContactDrawerData(resolved.legacyContactId);
  if (!data) notFound();

  return (
    <AdminShell title="" wide module="connections" hideHeader>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
        <ContactWorkspacePageClient
          data={data}
          affiliations={data.affiliations}
          editMode={sp.mode === "edit"}
          returnTo={returnTo}
        />
      </Suspense>
    </AdminShell>
  );
}
