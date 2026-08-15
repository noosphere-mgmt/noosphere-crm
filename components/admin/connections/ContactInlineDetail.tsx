"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { patchContactFieldAction } from "@/app/admin/contacts/actions";
import { DrawerOverviewCard } from "@/components/admin/connections/DrawerOverviewCard";
import { InlineEditProvider } from "@/components/admin/inline/InlineEditProvider";
import { InlineRecordToolbar } from "@/components/admin/inline/InlineRecordChrome";
import {
  InlineBooleanField,
  InlineCompanyPickerField,
  InlineEmailLinkField,
  InlineMultiSelectField,
  InlineReadOnlyField,
  InlineSelectField,
  InlineTelWithAreaField,
  InlineTextAreaField,
  InlineTextField,
} from "@/components/admin/inline/InlineFields";
import { COVERAGE_OPTIONS } from "@/lib/connectionsValues";
import { contactDrawerHref } from "@/lib/connectionsDrawerNav";
import type { ContactDetailTabId } from "@/lib/contactDetailTab";
import { COMPANY_ROLE_LABELS, COMPANY_ROLES, PREFERRED_LANGUAGES } from "@/lib/lookups";
import type { ContactCrmSummary } from "@/lib/repos/contactCrmSummary";
import type { CompanyOption } from "@/lib/repos/companies";
import type { Contact } from "@/lib/types/entities";

function CrmStat({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900">{value}</dd>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="block rounded-sm transition-colors hover:bg-slate-50/80">
        {content}
      </Link>
    );
  }
  return <div>{content}</div>;
}

export function ContactInlineDetail({
  contact,
  companies = [],
  crmSummary,
  lastActivityDate,
  deleteAction,
  initialEditHighlight = false,
  embedded = false,
  tabHrefFn,
}: {
  contact: Contact;
  companies?: CompanyOption[];
  crmSummary?: ContactCrmSummary;
  lastActivityDate?: string | null;
  deleteAction?: () => Promise<void>;
  initialEditHighlight?: boolean;
  embedded?: boolean;
  tabHrefFn?: (tab: ContactDetailTabId) => string;
}) {
  const save = useCallback(
    (field: string) => async (value: unknown) => {
      const result = await patchContactFieldAction(contact.id, field, JSON.stringify(value));
      return { ok: result.ok, error: result.ok ? undefined : result.error };
    },
    [contact.id],
  );
  const searchParams = useSearchParams();

  function defaultTabHref(tab: ContactDetailTabId) {
    return contactDrawerHref("/admin/contacts", searchParams, contact.id, tab);
  }
  const resolveTabHref = tabHrefFn ?? defaultTabHref;

  const body = (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <DrawerOverviewCard title="Details" columns={3} mobileColumns={2} dense={false} className="w-full">
        <InlineTextField label="First Name" value={contact.first_name} onSave={save("first_name")} />
        <InlineTextField label="Last Name" value={contact.last_name} onSave={save("last_name")} />
        <InlineTextField label="Chinese Name" value={contact.chinese_name} onSave={save("chinese_name")} />
        <InlineCompanyPickerField
          label="Company"
          companyId={contact.company_id}
          companyName={contact.company_name ?? null}
          companies={companies}
          onSave={save("company_id")}
        />
        <InlineTextField label="Title" value={contact.title} onSave={save("title")} />
        <InlineTextField label="Locate at" value={contact.locate_at} onSave={save("locate_at")} />
        <InlineBooleanField label="Primary" value={contact.is_primary} onSave={save("is_primary")} />
        <InlineBooleanField
          label="Status"
          value={contact.is_active}
          onSave={save("is_active")}
          trueLabel="Active"
          falseLabel="Inactive"
        />
        <InlineSelectField
          label="Language"
          value={contact.preferred_language}
          options={PREFERRED_LANGUAGES.map((l) => ({ value: l, label: l }))}
          onSave={save("preferred_language")}
        />
        <InlineMultiSelectField
          label="Coverage"
          values={contact.coverage ?? []}
          options={[...COVERAGE_OPTIONS]}
          onSave={save("coverage")}
          colSpan={1}
          allowSelectAll
        />
        <InlineMultiSelectField
          label="Contact Role"
          values={contact.contact_role ?? []}
          options={[...COMPANY_ROLES]}
          onSave={save("contact_role")}
          optionLabel={(v) => COMPANY_ROLE_LABELS[v] ?? v}
          colSpan={1}
        />
        {crmSummary && crmSummary.openOpportunities > 0 ? (
          <CrmStat
            label="Open opps"
            value={crmSummary.openOpportunities}
            href={resolveTabHref("opportunities")}
          />
        ) : null}
        {crmSummary && crmSummary.properties > 0 ? (
          <CrmStat label="Properties" value={crmSummary.properties} href={resolveTabHref("premises")} />
        ) : null}
        {lastActivityDate ? (
          <InlineReadOnlyField label="Last Activity" value={lastActivityDate.slice(0, 10)} />
        ) : null}
      </DrawerOverviewCard>

      <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-3 md:grid-cols-2">
        <DrawerOverviewCard title="Contact Channels" columns={2} dense={false} matchHeight className="w-full min-w-0">
          <InlineTelWithAreaField
            label="Phone"
            areaCode={contact.phone_area_code}
            number={contact.phone}
            onSaveAreaCode={save("phone_area_code")}
            onSaveNumber={save("phone")}
          />
          <InlineTelWithAreaField
            label="Mobile"
            areaCode={contact.mobile_area_code}
            number={contact.mobile}
            onSaveAreaCode={save("mobile_area_code")}
            onSaveNumber={save("mobile")}
          />
          <InlineTelWithAreaField
            label="WhatsApp"
            areaCode={contact.whatsapp_area_code}
            number={contact.whatsapp}
            onSaveAreaCode={save("whatsapp_area_code")}
            onSaveNumber={save("whatsapp")}
            link="whatsapp"
          />
          <InlineTextField label="WeChat" value={contact.wechat} onSave={save("wechat")} />
          <InlineEmailLinkField label="Email" value={contact.email} onSave={save("email")} />
          <InlineReadOnlyField label="Country" value={contact.company_country ?? null} />
          <InlineReadOnlyField label="City" value={contact.company_city ?? null} />
        </DrawerOverviewCard>

        <DrawerOverviewCard title="Notes" columns={1} dense={false} matchHeight className="w-full min-w-0">
          <InlineTextAreaField
            label="Internal Remarks"
            value={contact.notes}
            onSave={save("notes")}
            compact
          />
        </DrawerOverviewCard>
      </div>
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <InlineEditProvider initialEditHighlight={initialEditHighlight}>
      <div className="mb-3 flex items-start justify-end gap-2">
        {deleteAction ? <InlineRecordToolbar deleteAction={deleteAction} /> : null}
      </div>
      {body}
    </InlineEditProvider>
  );
}
