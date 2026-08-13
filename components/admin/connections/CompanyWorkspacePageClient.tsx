"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { updateCompanyAction } from "@/app/admin/companies/actions";
import { AdvisoryWorkspaceShell } from "@/components/admin/workspace/AdvisoryWorkspaceShell";
import { EntityActivityWorkspace } from "@/components/admin/activities/EntityActivityWorkspace";
import { CompanyContactsTabClient } from "@/components/admin/connections/CompanyContactsTabClient";
import { CompanyFeesTab } from "@/components/admin/connections/CompanyFeesTab";
import { CompanyInlineOverview } from "@/components/admin/connections/CompanyInlineOverview";
import { CompanySupplyTab } from "@/components/admin/connections/CompanySupplyTab";
import { CompanyWorkspaceHeader } from "@/components/admin/connections/CompanyWorkspaceHeader";
import { CompanyWorkspaceTabs } from "@/components/admin/connections/CompanyWorkspaceTabs";
import { LinkedOpportunitiesTable } from "@/components/admin/connections/LinkedOpportunitiesTable";
import { FormEditingContext, ModuleStickyEditBar } from "@/components/admin/ModuleActionBar";
import { CompanyFormFields } from "@/components/admin/CompanyFormFields";
import { InlineEditProvider } from "@/components/admin/inline/InlineEditProvider";
import type { CompanyDetailTabId } from "@/lib/companyDetailTab";
import { getCompanyWorkspaceTab, type CompanyWorkspaceTabId } from "@/lib/companyWorkspaceTab";
import { companyWorkspaceHref } from "@/lib/companyWorkspaceNav";
import type { CompanyDrawerData } from "@/lib/repos/connectionsDrawer";
import type { CompanyFeeDealRow } from "@/lib/repos/connectionOpportunities";

export function CompanyWorkspacePageClient({
  data,
  feeRows,
  editMode,
  returnTo = "/admin/companies",
}: {
  data: CompanyDrawerData;
  feeRows: CompanyFeeDealRow[];
  editMode: boolean;
  returnTo?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = getCompanyWorkspaceTab({ tab: searchParams.get("tab") });
  const { company } = data;
  const formId = `company-detail-${company.id}`;
  const update = updateCompanyAction.bind(null, company.id);
  const viewHref = companyWorkspaceHref(company, tab, undefined, returnTo);

  function workspaceTabHref(legacyTab: CompanyDetailTabId): string {
    const map: Partial<Record<CompanyDetailTabId, CompanyWorkspaceTabId>> = {
      overview: "profile",
      contacts: "contacts",
      opportunities: "deals",
      premises: "supply",
      activities: "activities",
      relationships: "supply",
      notes: "profile",
    };
    return companyWorkspaceHref(company, map[legacyTab] ?? "profile", undefined, returnTo);
  }

  const counts = {
    contacts: data.contacts.length,
    deals: data.opportunities.length,
    supply: data.spaces.length,
  };

  if (editMode) {
    return (
      <InlineEditProvider resetKey={company.id}>
        <div className="space-y-4 pt-14">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <FormEditingContext.Provider value={true}>
              <form id={formId} action={update} className="space-y-4">
                <CompanyFormFields defaults={company} />
              </form>
            </FormEditingContext.Provider>
          </div>
          <ModuleStickyEditBar
            formId={formId}
            onCancel={() => router.push(viewHref)}
          />
        </div>
      </InlineEditProvider>
    );
  }

  function renderTab() {
    switch (tab) {
      case "profile":
        return (
          <CompanyInlineOverview
            company={company}
            crmSummary={data.crmSummary}
            lastActivityDate={data.lastActivityDate}
            embedded
            tabHrefFn={workspaceTabHref}
          />
        );
      case "contacts":
        return (
          <CompanyContactsTabClient
            companyId={company.id}
            companyName={company.company_name}
            companyBusinessId={company.business_id}
            contacts={data.contacts}
            companies={data.companies}
            listReturnTo={returnTo}
          />
        );
      case "deals":
        return (
          <LinkedOpportunitiesTable
            rows={data.opportunities}
            mode="company"
            newOpportunityHref={`/admin/opportunities?new=1&company_id=${company.id}`}
          />
        );
      case "supply":
        return <CompanySupplyTab companyId={company.id} spaces={data.spaces} />;
      case "activities":
        return (
          <EntityActivityWorkspace
            activities={data.timeline}
            defaults={{
              company_business_id: company.business_id ?? null,
              company_name: company.company_name,
            }}
          />
        );
      case "fees":
        return <CompanyFeesTab rows={feeRows} />;
      default:
        return null;
    }
  }

  return (
    <InlineEditProvider initialEditHighlight resetKey={company.id}>
      <AdvisoryWorkspaceShell
        header={
          <CompanyWorkspaceHeader
            company={company}
            lastActivityDate={data.lastActivityDate}
            returnTo={returnTo}
          />
        }
        tabs={<CompanyWorkspaceTabs company={company} counts={counts} returnTo={returnTo} />}
        showAssistToggle={false}
      >
        {renderTab()}
      </AdvisoryWorkspaceShell>
    </InlineEditProvider>
  );
}

/** @deprecated Use CompanyWorkspacePageClient */
export const CompanyDetailPageClient = CompanyWorkspacePageClient;
