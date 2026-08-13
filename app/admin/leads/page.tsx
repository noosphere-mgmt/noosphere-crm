import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { LeadsPageClient } from "@/components/admin/leads/LeadsPageClient";
import { AdminListLoadingFallback } from "@/components/admin/layout/AdminListLoadingFallback";
import { listCompanyOptions } from "@/lib/repos/companies";
import { listContactOptions } from "@/lib/repos/contacts";
import { getLead, listLeads } from "@/lib/repos/leads";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string; new?: string }>;
}) {
  const sp = await searchParams;
  const [allLeads, companies, contacts] = await Promise.all([
    listLeads(),
    listCompanyOptions(),
    listContactOptions(),
  ]);

  const requestedId = Number.parseInt(sp.lead ?? "", 10);
  const selectedLead =
    Number.isFinite(requestedId) && requestedId > 0 ? await getLead(requestedId) : null;

  return (
    <AdminShell
      title="Leads"
      module="opportunities"
      wide
      actions={
        <Link
          href="/admin/leads?new=1"
          className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          + Lead
        </Link>
      }
    >
      <Suspense fallback={<AdminListLoadingFallback />}>
        <LeadsPageClient
          leads={allLeads}
          companies={companies}
          contacts={contacts}
          selectedLead={selectedLead}
        />
      </Suspense>
    </AdminShell>
  );
}
