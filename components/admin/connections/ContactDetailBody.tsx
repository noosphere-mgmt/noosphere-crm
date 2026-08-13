"use client";

import Link from "next/link";
import { EntityActivityWorkspace } from "@/components/admin/activities/EntityActivityWorkspace";
import { ContactCompanyAffiliationsCard } from "@/components/admin/connections/ContactCompanyAffiliationsCard";
import { ContactCompanyTab } from "@/components/admin/connections/ContactCompanySummary";
import { ContactInlineDetail } from "@/components/admin/connections/ContactInlineDetail";
import { EntityRelationshipsTab } from "@/components/admin/connections/EntityRelationshipsTab";
import { LinkedOpportunitiesTable } from "@/components/admin/connections/LinkedOpportunitiesTable";
import { getContactTab, type ContactDetailTabId } from "@/lib/contactDetailTab";
import { getContactLabel } from "@/lib/contactName";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import type { ContactDrawerData } from "@/lib/repos/connectionsDrawer";
import type { Asset } from "@/lib/types/entities";

function spaceLinkRoles(space: Asset, companyId: number | null): string[] {
  if (companyId == null) return [];
  const roles: string[] = [];
  if (space.operator_company_id === companyId) roles.push("Operator");
  if (space.landlord_company_id === companyId) roles.push("Landlord");
  if (space.current_tenant_company_id === companyId) roles.push("Tenant");
  return roles;
}

/** Shared tab body for contact drawer and full-page workspace. */
export function ContactDetailBody({
  data,
  tab,
  tabHrefFn,
}: {
  data: ContactDrawerData;
  tab?: string | null;
  /** Optional override for overview CRM stat links (full-page workspace). */
  tabHrefFn?: (tab: ContactDetailTabId) => string;
}) {
  const active = getContactTab({ tab: tab ?? undefined });
  const {
    contact,
    company,
    companyCrmSummary,
    companies,
    opportunities,
    spaces,
    relationships,
    activities,
  } = data;

  if (active === "overview") {
    return (
      <div className="space-y-4">
        <ContactInlineDetail
          contact={contact}
          companies={companies}
          crmSummary={data.crmSummary}
          lastActivityDate={data.lastActivityDate}
          embedded
          tabHrefFn={tabHrefFn}
        />
        <ContactCompanyAffiliationsCard
          contactId={contact.id}
          affiliations={data.affiliations ?? []}
          companies={companies}
        />
      </div>
    );
  }

  if (active === "company") {
    if (!company) {
      return (
        <div className="space-y-4">
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No primary company linked. Add affiliations below.
          </p>
          <ContactCompanyAffiliationsCard
            contactId={contact.id}
            affiliations={data.affiliations ?? []}
            companies={companies}
          />
        </div>
      );
    }
    return (
      <ContactCompanyTab
        company={company}
        crmSummary={companyCrmSummary ?? undefined}
        lastActivityDate={data.lastActivityDate}
      />
    );
  }

  if (active === "relationships") {
    return (
      <EntityRelationshipsTab
        entityType="contact"
        entityId={contact.id}
        entityName={getContactLabel(contact)}
        relationships={relationships}
        basePath="/admin/contacts"
      />
    );
  }

  if (active === "activities") {
    return (
      <EntityActivityWorkspace
        activities={activities}
        defaults={{
          contact_business_id: contact.business_id ?? null,
          contact_name: getContactLabel(contact),
          company_business_id: company?.business_id ?? null,
          company_name: contact.company_name ?? company?.company_name ?? null,
        }}
      />
    );
  }

  if (active === "opportunities") {
    return (
      <LinkedOpportunitiesTable
        rows={opportunities}
        mode="contact"
        newOpportunityHref={`/admin/opportunities?new=1&contact_id=${contact.id}`}
      />
    );
  }

  if (active === "premises") {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Properties</h3>
          <Link href="/admin/properties/premises" className={`text-sm font-medium ${connectionsGlassClasses.link}`}>
            All properties
          </Link>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Space</th>
              <th className="px-4 py-2 font-medium">Building</th>
              <th className="px-4 py-2 font-medium">Link</th>
            </tr>
          </thead>
          <tbody>
            {spaces.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  No properties linked via company.
                </td>
              </tr>
            ) : (
              spaces.map((space) => (
                <tr key={space.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{space.display_name_en}</td>
                  <td className="px-4 py-2 text-slate-700">{space.building_name ?? space.building_label ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-700">
                    {spaceLinkRoles(space, contact.company_id).join(", ") || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
