"use client";

import { useState, type ReactNode } from "react";
import {
  LeadRequirementIntake,
  type LeadRequirementPatch,
} from "@/components/admin/leads/LeadRequirementIntake";
import { LeadRequirementTypeFields } from "@/components/admin/leads/LeadRequirementTypeFields";
import { leadFieldLabel } from "@/lib/leadFields";
import {
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  normalizeLeadSource,
} from "@/lib/leadValues";
import type { Lead } from "@/lib/repos/leads";

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";
const boxFieldsClass = "grid grid-cols-2 gap-x-3 gap-y-3";

function FormBox({
  title,
  children,
  tone = "default",
}: {
  title: string;
  children: ReactNode;
  tone?: "default" | "amber";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50/40"
      : "border-slate-200 bg-white";
  return (
    <section className={`rounded-xl border p-4 ${toneClass}`}>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">{title}</h3>
      <div className={boxFieldsClass}>{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className={labelClass}>{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={fieldClass}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block min-w-0">
      <span className={labelClass}>{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        rows={rows}
        className={fieldClass}
      />
    </label>
  );
}

type LeadFormDefaults = Partial<Lead> & {
  office_space_required?: boolean | null;
};

export function LeadForm({
  lead,
  action,
  startWithCapture = false,
}: {
  lead?: Lead;
  action: (formData: FormData) => void | Promise<void>;
  startWithCapture?: boolean;
}) {
  const [defaults, setDefaults] = useState<LeadFormDefaults>(lead ?? {});
  const [formKey, setFormKey] = useState(0);
  const [intakeSeed] = useState(() =>
    [lead?.email_excerpt, lead?.requirement_notes, lead?.ai_digest]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join("\n\n"),
  );

  function onApply(patch: LeadRequirementPatch) {
    setDefaults((current) => {
      const nextNotes =
        patch.requirement_notes && current.requirement_notes?.trim()
          ? current.requirement_notes.trim() === patch.requirement_notes.trim()
            ? current.requirement_notes
            : `${current.requirement_notes.trim()}\n\n--- Requirement Intake ---\n${patch.requirement_notes}`
          : (patch.requirement_notes ?? current.requirement_notes);
      const nextDigest =
        patch.ai_digest && current.ai_digest?.trim() && !current.ai_digest.includes(patch.ai_digest)
          ? `${current.ai_digest.trim()}\n${patch.ai_digest}`
          : (patch.ai_digest ?? current.ai_digest);
      return {
        ...current,
        ...patch,
        requirement_notes: nextNotes ?? null,
        ai_digest: nextDigest ?? null,
      };
    });
    setFormKey((key) => key + 1);
  }

  const officeDefault =
    defaults.office_space_required == null
      ? "unknown"
      : defaults.office_space_required
        ? "yes"
        : "no";

  return (
    <div className="space-y-4">
      <LeadRequirementIntake
        initiallyOpen={startWithCapture || !lead}
        initialText={intakeSeed}
        onApply={onApply}
      />

      <form key={formKey} action={action} className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <FormBox title="Lead">
            <label className="block min-w-0">
              <span className={labelClass}>{leadFieldLabel("status")}</span>
              <select name="status" defaultValue={defaults.status ?? "new"} className={fieldClass}>
                {LEAD_STATUSES.filter(
                  (value) => value !== "converted" || lead?.status === "converted",
                ).map((value) => (
                  <option key={value} value={value}>
                    {LEAD_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block min-w-0">
              <span className={labelClass}>{leadFieldLabel("source")}</span>
              <select
                name="source"
                defaultValue={normalizeLeadSource(defaults.source)}
                className={fieldClass}
              >
                {LEAD_SOURCES.map((value) => (
                  <option key={value} value={value}>
                    {LEAD_SOURCE_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label={leadFieldLabel("contact_name")}
              name="contact_name"
              defaultValue={defaults.contact_name}
            />
            <Field
              label={leadFieldLabel("company_name")}
              name="company_name"
              defaultValue={defaults.company_name}
            />
            <Field
              label={leadFieldLabel("email")}
              name="email"
              type="email"
              defaultValue={defaults.email}
            />
            <Field label={leadFieldLabel("phone")} name="phone" defaultValue={defaults.phone} />
            <Field
              label={leadFieldLabel("website")}
              name="website"
              defaultValue={defaults.website}
            />
            <Field
              label={leadFieldLabel("email_subject")}
              name="email_subject"
              defaultValue={defaults.email_subject}
            />
            <Field
              label={leadFieldLabel("email_message_id")}
              name="email_message_id"
              defaultValue={defaults.email_message_id}
            />
            <Field
              label={leadFieldLabel("email_thread_id")}
              name="email_thread_id"
              defaultValue={defaults.email_thread_id}
            />
          </FormBox>

          <FormBox title="Requirement" tone="amber">
            <label className="block min-w-0">
              <span className={labelClass}>{leadFieldLabel("office_space_required")}</span>
              <select name="office_space_required" defaultValue={officeDefault} className={fieldClass}>
                <option value="unknown">To Verify</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <Field
              label={leadFieldLabel("next_lease_expiry")}
              name="next_lease_expiry"
              type="date"
              defaultValue={defaults.next_lease_expiry}
            />
            <Field
              label={leadFieldLabel("location")}
              name="preferred_location"
              defaultValue={defaults.preferred_location}
            />
            <Field
              label={leadFieldLabel("next_follow_up_date")}
              name="next_follow_up_date"
              type="date"
              defaultValue={defaults.next_follow_up_date}
            />
            <LeadRequirementTypeFields
              categoryDefault={defaults.property_category_preference}
              subtypeDefault={defaults.property_type_preference}
            />
            <Field
              label={leadFieldLabel("required_area_sqft")}
              name="required_area_sqft"
              type="number"
              defaultValue={defaults.required_area_sqft}
            />
            <Field
              label={leadFieldLabel("required_capacity_pax")}
              name="required_capacity_pax"
              type="number"
              defaultValue={defaults.required_capacity_pax}
            />
          </FormBox>

          <FormBox title="Notes">
            <TextArea
              label={leadFieldLabel("email_excerpt")}
              name="email_excerpt"
              defaultValue={defaults.email_excerpt}
              placeholder="Paste the relevant email content here until IMAP is connected."
            />
            <TextArea
              label={leadFieldLabel("requirement_notes")}
              name="requirement_notes"
              defaultValue={defaults.requirement_notes}
            />
            <TextArea
              label={leadFieldLabel("ai_digest")}
              name="ai_digest"
              defaultValue={defaults.ai_digest}
              placeholder="Structured capture summary and email workflow digest."
            />
            <TextArea
              label={leadFieldLabel("qualification_reason")}
              name="qualification_reason"
              defaultValue={defaults.qualification_reason}
            />
          </FormBox>

          <FormBox title="Ownership">
            <Field
              label={leadFieldLabel("assigned_owner")}
              name="assigned_owner"
              defaultValue={defaults.assigned_owner}
            />
            <Field
              label={leadFieldLabel("virtual_staff")}
              name="virtual_staff"
              defaultValue={defaults.virtual_staff}
            />
            <Field
              label={leadFieldLabel("qualification_score")}
              name="qualification_score"
              type="number"
              defaultValue={defaults.qualification_score}
            />
            <Field
              label={leadFieldLabel("last_email_at")}
              name="last_email_at"
              type="datetime-local"
              defaultValue={defaults.last_email_at?.slice(0, 16)}
            />
          </FormBox>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          {lead ? "Save Lead" : "Create Lead"}
        </button>
      </form>
    </div>
  );
}
