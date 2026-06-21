"use client";

import { useSearchParams } from "next/navigation";
import { ContactCompanyTab } from "@/components/admin/connections/ContactCompanySummary";
import { ContactInlineDetail } from "@/components/admin/connections/ContactInlineDetail";
import { EntityRelationshipsTab } from "@/components/admin/connections/EntityRelationshipsTab";
import { LinkedOpportunitiesTable } from "@/components/admin/connections/LinkedOpportunitiesTable";
import { ContactDetailTabs } from "@/components/admin/connections/ContactDetailTabs";
import { EntityActivitiesTab } from "@/components/admin/activities/EntityActivitiesTab";
import {
  ConnectionsDrawerHeader,
  ConnectionsDrawerTableLink,
} from "@/components/admin/connections/ConnectionsDrawerHeader";
import { InlineEditProvider } from "@/components/admin/inline/InlineEditProvider";
import { contactDrawerHref } from "@/lib/connectionsDrawerNav";
import { getContactTab } from "@/lib/contactDetailTab";
import { getContactLabel } from "@/lib/contactName";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import type { ContactDrawerData } from "@/lib/repos/connectionsDrawer";
import type { Asset } from "@/lib/types/entities";
import Link from "next/link";

const overlayClass = "fixed inset-0 z-40 bg-slate-900/10 transition-opacity";
const panelClass =
  "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-slate-50 shadow-xl lg:w-[42vw] lg:max-w-[45vw]";

function spaceLinkRoles(space: Asset, companyId: number): string[] {
  const roles: string[] = [];
  if (space.operator_company_id === companyId) roles.push("Operator");
  if (space.landlord_company_id === companyId) roles.push("Landlord");
  if (space.current_tenant_company_id === companyId) roles.push("Tenant");
  return roles;
}

function ContactDrawerBody({ data }: { data: ContactDrawerData }) {
  const searchParams = useSearchParams();
  const tab = getContactTab({ tab: searchParams.get("tab") ?? undefined });
  const { contact, company, companyCrmSummary, companies, opportunities, spaces, relationships, activities } = data;

  if (tab === "overview") {
    return (
      <ContactInlineDetail
        contact={contact}
        companies={companies}
        crmSummary={data.crmSummary}
        lastActivityDate={data.lastActivityDate}
        embedded
      />
    );
  }

  if (tab === "company") {
    if (!company) {
      return (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Company record not found.
        </p>
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

  if (tab === "relationships") {
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

  if (tab === "activities") {
    return (
      <EntityActivitiesTab
        activities={activities}
        defaults={{
          contact_id: contact.id,
          contact_name: contact.contact_name,
          company_id: contact.company_id,
          company_name: contact.company_name ?? company?.company_name ?? null,
        }}
      />
    );
  }

  if (tab === "opportunities") {
    return <LinkedOpportunitiesTable rows={opportunities} mode="contact" />;
  }

  if (tab === "premises") {
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

  if (tab === "notes") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <p className="whitespace-pre-wrap text-sm leading-snug text-slate-800">
          {contact.notes?.trim() || "No notes yet. Edit in Overview."}
        </p>
      </div>
    );
  }

  return null;
}

export function ContactDrawer({
  data,
  onClose,
}: {
  data: ContactDrawerData | null;
  onClose: () => void;
}) {
  if (!data) return null;

  const { contact } = data;

  return (
    <>
      <button type="button" className={overlayClass} aria-label="Close contact panel" onClick={onClose} />
      <aside
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-label={`Contact: ${getContactLabel(contact)}`}
      >
        <InlineEditProvider resetKey={contact.id}>
          <ConnectionsDrawerHeader
            title={getContactLabel(contact)}
            subtitle={contact.company_name ?? undefined}
            onClose={onClose}
          />
          <div className="shrink-0 bg-white px-4 pt-2">
            <ContactDetailTabs embedded contactId={contact.id} />
          </div>
          <div className="relative z-0 flex-1 overflow-y-auto px-4 py-3">
            <ContactDrawerBody data={data} />
          </div>
        </InlineEditProvider>
      </aside>
    </>
  );
}
