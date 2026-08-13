"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { updateContactAction } from "@/app/admin/contacts/actions";
import { AdvisoryWorkspaceShell } from "@/components/admin/workspace/AdvisoryWorkspaceShell";
import { ContactDetailBody } from "@/components/admin/connections/ContactDetailBody";
import { ContactFormFields } from "@/components/admin/ContactFormFields";
import { ContactWorkspaceHeader } from "@/components/admin/connections/ContactWorkspaceHeader";
import { ContactWorkspaceTabs } from "@/components/admin/connections/ContactWorkspaceTabs";
import { FormEditingContext, ModuleStickyEditBar } from "@/components/admin/ModuleActionBar";
import { InlineEditProvider } from "@/components/admin/inline/InlineEditProvider";
import type { ContactDetailTabId } from "@/lib/contactDetailTab";
import { getContactWorkspaceTab } from "@/lib/contactWorkspaceTab";
import { contactWorkspaceHref } from "@/lib/contactWorkspaceNav";
import type { ContactDrawerData } from "@/lib/repos/connectionsDrawer";
import type { ContactCompanyAffiliation } from "@/lib/repos/contactCompanyAffiliations";

export function ContactWorkspacePageClient({
  data,
  affiliations,
  editMode,
  returnTo = "/admin/companies",
}: {
  data: ContactDrawerData;
  affiliations: ContactCompanyAffiliation[];
  editMode: boolean;
  returnTo?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = getContactWorkspaceTab({ tab: searchParams.get("tab") });
  const { contact } = data;
  const formId = `contact-detail-${contact.id}`;
  const update = updateContactAction.bind(null, contact.id);
  const viewHref = contactWorkspaceHref(contact, tab, undefined, returnTo);

  function workspaceTabHref(detailTab: ContactDetailTabId): string {
    if (detailTab === "notes") return contactWorkspaceHref(contact, "activities", undefined, returnTo);
    return contactWorkspaceHref(contact, detailTab, undefined, returnTo);
  }

  const counts = {
    relationships: data.relationships.length,
    opportunities: data.opportunities.length,
    premises: data.spaces.length,
  };

  if (editMode) {
    return (
      <InlineEditProvider resetKey={contact.id}>
        <div className="space-y-4 pt-14">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <FormEditingContext.Provider value={true}>
              <form id={formId} action={update} className="space-y-4">
                <ContactFormFields defaults={contact} companies={data.companies} />
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

  return (
    <InlineEditProvider initialEditHighlight resetKey={contact.id}>
      <AdvisoryWorkspaceShell
        header={
          <ContactWorkspaceHeader
            contact={contact}
            affiliations={affiliations}
            lastActivityDate={data.lastActivityDate}
            returnTo={returnTo}
          />
        }
        tabs={<ContactWorkspaceTabs contact={contact} counts={counts} returnTo={returnTo} />}
        showAssistToggle={false}
      >
        <ContactDetailBody
          data={{ ...data, affiliations }}
          tab={tab}
          tabHrefFn={workspaceTabHref}
        />
      </AdvisoryWorkspaceShell>
    </InlineEditProvider>
  );
}

/** @deprecated Use ContactWorkspacePageClient */
export const ContactDetailPageClient = ContactWorkspacePageClient;
