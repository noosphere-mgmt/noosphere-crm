"use client";

import { useEffect, useState } from "react";
import { FormField, SelectField, TextAreaField } from "@/components/admin/AdminFormFields";
import { useFormEditing } from "@/components/admin/ModuleActionBar";
import { COVERAGE_OPTIONS } from "@/lib/connectionsValues";
import { suggestDisplayName } from "@/lib/contactName";
import { COMPANY_ROLE_LABELS, COMPANY_ROLES, PREFERRED_LANGUAGES } from "@/lib/lookups";
import { toLegacyCompanySelectOptions } from "@/lib/crmSelectOptions";
import type { CompanyRole, Contact } from "@/lib/types/entities";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";

type CompanyOption = { id: number; company_name: string; v1_company_id?: string | null };

type Props = {
  defaults?: Contact;
  companies: CompanyOption[];
  fixedCompanyId?: number;
  layout?: "default" | "wide";
};

const gridClass = "grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3";

function ContactRoleSelect({ defaults }: { defaults?: Contact }) {
  const editing = useFormEditing();
  const selected = new Set<CompanyRole>(defaults?.contact_role ?? []);

  return (
    <fieldset className="block text-sm font-medium text-slate-700">
      <span className="mb-1 block">Contact Role</span>
      <div className="mt-1 flex flex-wrap gap-2">
        {COMPANY_ROLES.map((role) => (
          <label
            key={role}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            <input
              type="checkbox"
              name="contact_role"
              value={role}
              defaultChecked={selected.has(role)}
              disabled={!editing}
              className="rounded border-slate-300"
            />
            {COMPANY_ROLE_LABELS[role] ?? role}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CoverageSelect({ defaults }: { defaults?: Contact }) {
  const editing = useFormEditing();
  const selected = new Set(defaults?.coverage ?? []);

  return (
    <fieldset className="block text-sm font-medium text-slate-700">
      <span className="mb-1 block">Coverage</span>
      <div className="mt-1 flex flex-wrap gap-2">
        {COVERAGE_OPTIONS.map((option) => (
          <label
            key={option}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            <input
              type="checkbox"
              name="coverage"
              value={option}
              defaultChecked={selected.has(option)}
              disabled={!editing}
              className="rounded border-slate-300"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function StatusFields({ defaults }: { defaults?: Contact }) {
  const editing = useFormEditing();
  return (
    <div className="space-y-2 text-sm font-medium text-slate-700">
      <span className="block">Status</span>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={defaults?.is_active ?? true}
          disabled={!editing}
          className="rounded border-slate-300"
        />
        Active
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_primary"
          defaultChecked={defaults?.is_primary ?? false}
          disabled={!editing}
          className="rounded border-slate-300"
        />
        Primary contact
      </label>
    </div>
  );
}

export function ContactFormFields({ defaults, companies, fixedCompanyId, layout = "default" }: Props) {
  const editing = useFormEditing();
  const companyId = fixedCompanyId ?? defaults?.company_id;
  const [firstName, setFirstName] = useState(defaults?.first_name ?? "");
  const [lastName, setLastName] = useState(defaults?.last_name ?? "");
  const [displayName, setDisplayName] = useState(
    defaults?.display_name ?? defaults?.contact_name ?? "",
  );
  const [displayTouched, setDisplayTouched] = useState(false);

  useEffect(() => {
    if (!editing || displayTouched) return;
    const suggested = suggestDisplayName(firstName, lastName);
    if (suggested) setDisplayName(suggested);
  }, [firstName, lastName, displayTouched, editing]);

  const companyField =
    fixedCompanyId != null ? (
      <input type="hidden" name="company_id" value={fixedCompanyId} />
    ) : (
      <SelectField
        label="Company"
        name="company_id"
        defaultValue={companyId?.toString() ?? ""}
        placeholder="— Select company —"
        required
        options={toLegacyCompanySelectOptions(companies).map((c) => ({
          value: c.value,
          label: c.label,
        }))}
      />
    );

  const nameRow = (
    <div className={gridClass}>
      <FormField
        label="First name"
        name="first_name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        disabled={!editing}
        required={editing}
      />
      <FormField
        label="Last name"
        name="last_name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        disabled={!editing}
      />
      <FormField
        label="Chinese name"
        name="chinese_name"
        defaultValue={defaults?.chinese_name ?? ""}
        disabled={!editing}
      />
    </div>
  );

  const identityRow = (
    <div className={gridClass}>
      <FormField
        label="Display name"
        name="display_name"
        value={displayName}
        onChange={(e) => {
          setDisplayTouched(true);
          setDisplayName(e.target.value);
        }}
        disabled={!editing}
        required={editing}
      />
      <FormField label="Title" name="title" defaultValue={defaults?.title ?? ""} />
      <SelectField
        label="Preferred language"
        name="preferred_language"
        defaultValue={defaults?.preferred_language ?? ""}
        placeholder="— Not set —"
        options={PREFERRED_LANGUAGES}
      />
    </div>
  );

  const contactRow = (
    <div className={gridClass}>
      <FormField label="Email" name="email" type="email" defaultValue={defaults?.email ?? ""} />
      <FormField label="Phone" name="phone" defaultValue={defaults?.phone ?? ""} />
      <FormField label="WhatsApp" name="whatsapp" defaultValue={defaults?.whatsapp ?? ""} />
    </div>
  );

  const socialRow = (
    <div className={gridClass}>
      <FormField label="WeChat" name="wechat" defaultValue={defaults?.wechat ?? ""} />
      <ContactRoleSelect defaults={defaults} />
      <CoverageSelect defaults={defaults} />
      <StatusFields defaults={defaults} />
    </div>
  );

  if (layout === "wide") {
    return (
      <div className="space-y-4">
        {companyField}
        {nameRow}
        {identityRow}
        {contactRow}
        {socialRow}
        <TextAreaField label="Remarks" name="notes" defaultValue={defaults?.notes ?? ""} rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {defaults?.business_id ?? defaults?.v1_contact_id ? <RecordBusinessId id={defaults.business_id ?? defaults.v1_contact_id} /> : null}
      {companyField}
      {nameRow}
      {identityRow}
      {contactRow}
      {socialRow}
      <TextAreaField label="Remarks" name="notes" defaultValue={defaults?.notes ?? ""} />
    </div>
  );
}
