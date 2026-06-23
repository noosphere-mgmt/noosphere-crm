"use client";

import { SelectField } from "@/components/admin/AdminFormFields";
import { coerceCompanyIdToSelectValue, type CompanyV1SelectOption } from "@/lib/companyV1Display";

type ConnectionDefaults = {
  management_company_id?: string | null;
  operator_company_id?: string | null;
  current_tenant_company_id?: string | null;
  owner_company_id?: string | null;
};

export function CompanyConnectionFields({
  defaults,
  companyOptions,
  showManagement = true,
}: {
  defaults: ConnectionDefaults;
  companyOptions: CompanyV1SelectOption[];
  showManagement?: boolean;
}) {
  const mgmt = coerceCompanyIdToSelectValue(defaults.management_company_id, companyOptions);
  const operator = coerceCompanyIdToSelectValue(defaults.operator_company_id, companyOptions);
  const tenant = coerceCompanyIdToSelectValue(defaults.current_tenant_company_id, companyOptions);
  const owner = coerceCompanyIdToSelectValue(defaults.owner_company_id, companyOptions);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {showManagement ? (
        <SelectField
          label="Management company"
          name="management_company_id"
          defaultValue={mgmt}
          placeholder="— Select company —"
          options={companyOptions}
        />
      ) : null}
      <SelectField
        label="Operator"
        name="operator_company_id"
        defaultValue={operator}
        placeholder="— Select company —"
        options={companyOptions}
      />
      <SelectField
        label="Current tenant"
        name="current_tenant_company_id"
        defaultValue={tenant}
        placeholder="— Select company —"
        options={companyOptions}
      />
      <SelectField
        label="Owner"
        name="owner_company_id"
        defaultValue={owner}
        placeholder="— Select company —"
        options={companyOptions}
      />
    </div>
  );
}
