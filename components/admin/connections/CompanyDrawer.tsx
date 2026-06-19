"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CompanyContactsTabClient } from "@/components/admin/connections/CompanyContactsTabClient";
import { EntityActivitiesTab } from "@/components/admin/activities/EntityActivitiesTab";
import { CompanyDrawerFullEdit } from "@/components/admin/connections/CompanyDrawerFullEdit";
import { CompanyInlineOverview } from "@/components/admin/connections/CompanyInlineOverview";
import { EntityRelationshipsTab } from "@/components/admin/connections/EntityRelationshipsTab";
import { LinkedOpportunitiesTable } from "@/components/admin/connections/LinkedOpportunitiesTable";
import { ConnectionsDrawerTableLink } from "@/components/admin/connections/ConnectionsDrawerHeader";
import { CompanyDetailTabs } from "@/components/admin/CompanyDetailTabs";
import { CompanyDrawerHeader } from "@/components/admin/connections/CompanyDrawerHeader";
import { InlineEditProvider } from "@/components/admin/inline/InlineEditProvider";
import { getCompanyTab } from "@/lib/companyDetailTab";
import { formatCompanyRoles } from "@/lib/connectionsDisplay";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import type { CompanyDrawerData } from "@/lib/repos/connectionsDrawer";
import type { Asset } from "@/lib/types/entities";

const overlayViewClass = "fixed inset-0 z-40 bg-slate-900/10 transition-opacity";
const overlayEditClass = "fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px] transition-opacity";
const panelViewClass =
  "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-slate-50 shadow-xl lg:w-[42vw] lg:max-w-[45vw]";
const panelEditClass =
  "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-slate-50 shadow-2xl lg:w-[75vw] lg:max-w-6xl";

function spaceLinkRoles(space: Asset, companyId: number): string[] {
  const roles: string[] = [];
  if (space.operator_company_id === companyId) roles.push("Operator");
  if (space.landlord_company_id === companyId) roles.push("Landlord");
  if (space.current_tenant_company_id === companyId) roles.push("Tenant");
  return roles;
}

function CompanyDrawerBody({
  data,
  fullEdit,
}: {
  data: CompanyDrawerData;
  fullEdit: boolean;
}) {
  const searchParams = useSearchParams();
  const tab = getCompanyTab({ tab: searchParams.get("tab") ?? undefined });
  const { company, contacts, opportunities, spaces, timeline, companies } = data;
  const companyId = company.id;

  if (tab === "overview") {
    if (fullEdit) {
      return <CompanyDrawerFullEdit company={company} />;
    }
    return <CompanyInlineOverview company={company} crmSummary={data.crmSummary} lastActivityDate={data.lastActivityDate} embedded />;
  }

  if (tab === "contacts") {
    return (
      <CompanyContactsTabClient
        companyId={companyId}
        companyName={company.company_name}
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
      <EntityActivitiesTab
        activities={timeline}
        defaults={{
          company_id: companyId,
          company_name: company.company_name,
        }}
      />
    );
  }

  if (tab === "premises") {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Properties</h3>
          <Link href="/admin/properties/premises" className={`text-sm font-medium ${connectionsGlassClasses.link}`}>
            All Premises
          </Link>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Space</th>
              <th className="px-4 py-2 font-medium">Building</th>
              <th className="px-4 py-2 font-medium">Link</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {spaces.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No properties or premises linked to this company yet.
                </td>
              </tr>
            ) : (
              spaces.map((space) => (
                <tr key={space.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{space.display_name_en}</td>
                  <td className="px-4 py-2 text-slate-700">{space.building_name ?? space.building_label ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-700">{spaceLinkRoles(space, companyId).join(", ") || "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <ConnectionsDrawerTableLink href={`/admin/assets/${space.id}`}>
                      Open
                    </ConnectionsDrawerTableLink>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
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
  initialEditHighlight = false,
  fullEdit = false,
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
        className={fullEdit ? overlayEditClass : overlayViewClass}
        aria-label="Close company panel"
        onClick={onClose}
      />
      <aside
        className={fullEdit ? panelEditClass : panelViewClass}
        role="dialog"
        aria-modal="true"
        aria-label={fullEdit ? `Edit company: ${company.company_name}` : `Company: ${company.company_name}`}
      >
        <InlineEditProvider initialEditHighlight={initialEditHighlight && !fullEdit}>
          <CompanyDrawerHeader
            companyId={company.id}
            title={company.company_name}
            subtitle={roleLabel}
            fullEdit={fullEdit}
            onClose={onClose}
          />
          {!fullEdit ? (
            <div className="shrink-0 bg-white px-4 pt-2">
              <CompanyDetailTabs embedded companyId={company.id} />
            </div>
          ) : null}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <CompanyDrawerBody data={data} fullEdit={fullEdit} />
          </div>
        </InlineEditProvider>
      </aside>
    </>
  );
}
