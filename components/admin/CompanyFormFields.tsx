"use client";

import { FormField, TextAreaField } from "@/components/admin/AdminFormFields";
import { CoverageFields } from "@/components/admin/CoverageFields";
import { useFormEditing } from "@/components/admin/ModuleActionBar";
import {
  COMPANY_ROLES,
  COMPANY_ROLE_LABELS,
  RELATIONSHIP_STRENGTHS,
  RELATIONSHIP_STRENGTH_LABELS,
} from "@/lib/lookups";
import type { Company, CompanyRole, RelationshipStrength } from "@/lib/types/entities";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";

const selectClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

type Props = { defaults?: Company };

export function CompanyFormFields({ defaults }: Props) {
  const editing = useFormEditing();
  const normalizedRoles = (defaults?.roles ?? ["client"]).map((role) => {
    if (role === "property_management") return "building_management";
    if (role === "developer") return "other";
    return role;
  });
  const selectedRoles = new Set(normalizedRoles);

  return (
    <>
      {defaults?.business_id ?? defaults?.v1_company_id ? (
        <div className="mb-2">
          <RecordBusinessId id={defaults.business_id ?? defaults.v1_company_id} />
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Company name (EN)" name="company_name" defaultValue={defaults?.company_name ?? ""} required />
        <FormField label="Company name (CN)" name="company_name_cn" defaultValue={defaults?.company_name_cn ?? ""} />
        <FormField label="Company name (ZH)" name="company_name_zh" defaultValue={defaults?.company_name_zh ?? ""} />
        <FormField label="Country" name="country" defaultValue={defaults?.country ?? "Hong Kong"} />
        <FormField label="City" name="city" defaultValue={defaults?.city ?? "Hong Kong"} />
        <FormField label="District" name="district" defaultValue={defaults?.district ?? ""} />
      </div>

      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">Company role</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COMPANY_ROLES.map((role) => (
            <label key={role} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="roles"
                value={role}
                defaultChecked={selectedRoles.has(role)}
                disabled={!editing}
                className="rounded border-slate-300"
              />
              {COMPANY_ROLE_LABELS[role]}
            </label>
          ))}
        </div>
      </fieldset>

      <CoverageFields defaults={defaults?.coverage} />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Website" name="website" type="url" defaultValue={defaults?.website ?? ""} />
        <FormField label="Phone" name="phone" defaultValue={defaults?.phone ?? ""} />
        <FormField label="Email" name="email" type="email" defaultValue={defaults?.email ?? ""} />
        <FormField label="Industry" name="industry" defaultValue={defaults?.industry ?? ""} />
        <FormField label="Source" name="source" defaultValue={defaults?.source ?? ""} />
        <FormField label="Relationship owner" name="relationship_owner" defaultValue={defaults?.relationship_owner ?? ""} />
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Last Contact</span>
          <p className="mt-0.5 text-sm text-slate-900">{defaults?.last_contact_date?.slice(0, 10) ?? "—"}</p>
          <input type="hidden" name="last_contact_date" value={defaults?.last_contact_date?.slice(0, 10) ?? ""} />
          <span className="mt-1 block text-xs font-normal text-slate-500">
            Updated automatically from activities.
          </span>
        </label>
        <FormField label="Next follow-up date" name="next_follow_up_date" type="date" defaultValue={defaults?.next_follow_up_date?.slice(0, 10) ?? ""} />
        <label className="block text-sm font-medium text-slate-700">
          Relationship strength
          <select name="relationship_strength" defaultValue={defaults?.relationship_strength ?? ""} disabled={!editing} className={selectClass}>
            <option value="">— Not set —</option>
            {RELATIONSHIP_STRENGTHS.map((s) => (
              <option key={s} value={s}>{RELATIONSHIP_STRENGTH_LABELS[s]}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" name="is_active" defaultChecked={defaults?.is_active ?? true} disabled={!editing} className="rounded border-slate-300" />
        Active
      </label>

      <TextAreaField label="Notes" name="notes" defaultValue={defaults?.notes ?? ""} />
    </>
  );
}
