"use client";

import { useSearchParams } from "next/navigation";
import { CompanyContactsTabClient } from "@/components/admin/connections/CompanyContactsTabClient";
import { EntityActivityWorkspace } from "@/components/admin/activities/EntityActivityWorkspace";
import { CompanyInlineOverview } from "@/components/admin/connections/CompanyInlineOverview";
import { CompanySupplyTab } from "@/components/admin/connections/CompanySupplyTab";
import { EntityRelationshipsTab } from "@/components/admin/connections/EntityRelationshipsTab";
import { LinkedOpportunitiesTable } from "@/components/admin/connections/LinkedOpportunitiesTable";
import { CompanyDetailTabs } from "@/components/admin/CompanyDetailTabs";
import { CompanyDrawerHeader } from "@/components/admin/connections/CompanyDrawerHeader";
import { InlineEditProvider } from "@/components/admin/inline/InlineEditProvider";
import { getCompanyTab } from "@/lib/companyDetailTab";
import { formatCompanyRoles } from "@/lib/connectionsDisplay";
import type { CompanyDrawerData } from "@/lib/repos/connectionsDrawer";

const overlayViewClass = "fixed inset-0 z-40 bg-slate-900/10 transition-opacity";
const panelViewClass =
  "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 max-md:bottom-[calc(3.5rem+env(safe-area-inset-bottom))] max-md:bg-white md:bg-slate-50 shadow-xl lg:w-[42vw] lg:max-w-[45vw]";

function CompanyDrawerBody({
  data,
}: {
  data: CompanyDrawerData;
}) {
  const searchParams = useSearchParams();
  const tab = getCompanyTab({ tab: searchParams.get("tab") ?? undefined });
  const { company, contacts, opportunities, linkedProperties, timeline, companies } = data;
  const companyId = company.id;

  if (tab === "overview") {
    return <CompanyInlineOverview company={company} crmSummary={data.crmSummary} lastActivityDate={data.lastActivityDate} embedded />;
  }

  if (tab === "contacts") {
    return (
      <CompanyContactsTabClient
        companyId={companyId}
        companyName={company.company_name}
        companyBusinessId={company.business_id}
        contacts={contacts}
        companies={companies}
        drawerMode
      />
    );
  }

  if (tab === "opportunities") {
    return (
      <LinkedOpportunitiesTable
        rows={opportunities}
        mode="company"
        newOpportunityHref={`/admin/opportunities?new=1&company_id=${companyId}`}
      />
    );
  }

  if (tab === "relationships") {
    return (
      <EntityRelationshipsTab
        entityType="company"
        entityId={companyId}
        entityName={company.company_name}
        relationships={data.relationships}
        basePath="/admin/companies"
      />
    );
  }

  if (tab === "activities") {
    return (
      <EntityActivityWorkspace
        activities={timeline}
        defaults={{
          company_business_id: company.business_id ?? null,
          company_name: company.company_name,
        }}
      />
    );
  }

  if (tab === "premises") {
    return <CompanySupplyTab companyId={companyId} rows={linkedProperties} />;
  }

  if (tab === "notes") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="whitespace-pre-wrap text-sm text-slate-800">
          {company.notes?.trim() || "No notes yet. Edit in Overview."}
        </p>
      </div>
    );
  }

  return null;
}

export function CompanyDrawer({
  data,
  onClose,
}: {
  data: CompanyDrawerData | null;
  onClose: () => void;
  initialEditHighlight?: boolean;
  fullEdit?: boolean;
}) {
  if (!data) return null;

  const { company } = data;
  const roleLabel = formatCompanyRoles(company.roles?.length ? company.roles : ["client"]);

  return (
    <>
      <button
        type="button"
        className={overlayViewClass}
        aria-label="Close company panel"
        onClick={onClose}
      />
      <aside
        className={panelViewClass}
        role="dialog"
        aria-modal="true"
        aria-label={`Company: ${company.company_name}`}
      >
        <InlineEditProvider initialEditHighlight resetKey={company.id}>
          <CompanyDrawerHeader
            companyId={company.id}
            title={company.company_name}
            subtitle={roleLabel}
            businessId={company.business_id}
            onClose={onClose}
          />
          <div className="shrink-0 bg-white px-4 pt-2">
            <CompanyDetailTabs embedded companyId={company.id} />
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <CompanyDrawerBody data={data} />
          </div>
        </InlineEditProvider>
      </aside>
    </>
  );
}
