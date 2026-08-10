"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { updateContactAction } from "@/app/admin/contacts/actions";
import { AdvisoryWorkspaceShell } from "@/components/admin/workspace/AdvisoryWorkspaceShell";
import { EntityActivityWorkspace } from "@/components/admin/activities/EntityActivityWorkspace";
import { ContactCompanyAffiliationsCard } from "@/components/admin/connections/ContactCompanyAffiliationsCard";
import { ContactFormFields } from "@/components/admin/ContactFormFields";
import { ContactInlineDetail } from "@/components/admin/connections/ContactInlineDetail";
import { ContactRelationshipStrip } from "@/components/admin/connections/ContactRelationshipStrip";
import { ContactWorkspaceContextPanel } from "@/components/admin/connections/ContactWorkspaceContextPanel";
import { ContactWorkspaceHeader } from "@/components/admin/connections/ContactWorkspaceHeader";
import { ContactWorkspaceTabs } from "@/components/admin/connections/ContactWorkspaceTabs";
import { LinkedOpportunitiesTable } from "@/components/admin/connections/LinkedOpportunitiesTable";
import { FormEditingContext, ModuleActionBar } from "@/components/admin/ModuleActionBar";
import { InlineEditProvider } from "@/components/admin/inline/InlineEditProvider";
import { getContactLabel } from "@/lib/contactName";
import type { ContactDetailTabId } from "@/lib/contactDetailTab";
import { getContactWorkspaceTab, type ContactWorkspaceTabId } from "@/lib/contactWorkspaceTab";
import { contactWorkspaceHref } from "@/lib/contactWorkspaceNav";
import type { ContactDrawerData } from "@/lib/repos/connectionsDrawer";
import type { ContactCompanyAffiliation } from "@/lib/repos/contactCompanyAffiliations";

export function ContactWorkspacePageClient({
  data,
  affiliations,
  editMode,
}: {
  data: ContactDrawerData;
  affiliations: ContactCompanyAffiliation[];
  editMode: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = getContactWorkspaceTab({ tab: searchParams.get("tab") });
  const { contact } = data;
  const formId = `contact-detail-${contact.id}`;
  const update = updateContactAction.bind(null, contact.id);
  const viewHref = contactWorkspaceHref(contact, tab);
  const title = getContactLabel(contact);

  function workspaceTabHref(legacyTab: ContactDetailTabId): string {
    const map: Partial<Record<ContactDetailTabId, ContactWorkspaceTabId>> = {
      overview: "profile",
      company: "affiliations",
      opportunities: "deals",
      activities: "activities",
      notes: "activities",
      relationships: "profile",
      premises: "profile",
    };
    return contactWorkspaceHref(contact, map[legacyTab] ?? "profile");
  }

  const counts = {
    affiliations: affiliations.length,
    deals: data.opportunities.length,
  };

  if (editMode) {
    return (
      <InlineEditProvider resetKey={contact.id}>
        <div className="space-y-4">
          <div className="flex justify-end">
            <ModuleActionBar mode="edit" formId={formId} onCancel={() => router.push(viewHref)} module="connections" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <FormEditingContext.Provider value={true}>
              <form id={formId} action={update} className="space-y-4">
                <ContactFormFields defaults={contact} companies={data.companies} />
              </form>
            </FormEditingContext.Provider>
          </div>
        </div>
      </InlineEditProvider>
    );
  }

  function renderTab() {
    switch (tab) {
      case "profile":
        return (
          <ContactInlineDetail
            contact={contact}
            companies={data.companies}
            crmSummary={data.crmSummary}
            lastActivityDate={data.lastActivityDate}
            embedded
            tabHrefFn={workspaceTabHref}
          />
        );
      case "affiliations":
        return (
          <ContactCompanyAffiliationsCard
            contactId={contact.id}
            affiliations={affiliations}
            companies={data.companies}
          />
        );
      case "deals":
        return (
          <LinkedOpportunitiesTable
            rows={data.opportunities}
            mode="contact"
            newOpportunityHref={`/admin/opportunities?new=1&contact_id=${contact.id}`}
          />
        );
      case "activities":
        return (
          <EntityActivityWorkspace
            activities={data.activities}
            defaults={{
              contact_business_id: contact.business_id ?? null,
              contact_name: title,
              company_business_id: data.company?.business_id ?? null,
              company_name: contact.company_name,
            }}
          />
        );
      default:
        return null;
    }
  }

  return (
    <InlineEditProvider initialEditHighlight resetKey={contact.id}>
      <AdvisoryWorkspaceShell
        header={
          <ContactWorkspaceHeader
            contact={contact}
            affiliations={affiliations}
            lastActivityDate={data.lastActivityDate}
          />
        }
        requirementStrip={
          <ContactRelationshipStrip contact={contact} affiliations={affiliations} crmSummary={data.crmSummary} />
        }
        tabs={<ContactWorkspaceTabs contact={contact} counts={counts} />}
        contextPanel={<ContactWorkspaceContextPanel data={{ ...data, affiliations }} />}
        showAssistToggle={false}
      >
        {renderTab()}
      </AdvisoryWorkspaceShell>
    </InlineEditProvider>
  );
}

/** @deprecated Use ContactWorkspacePageClient */
export const ContactDetailPageClient = ContactWorkspacePageClient;
