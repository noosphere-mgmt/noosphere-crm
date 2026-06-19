"use client";

import { updateCompanyAction } from "@/app/admin/companies/actions";
import { CompanyFormFields } from "@/components/admin/CompanyFormFields";
import { FormEditingContext } from "@/components/admin/ModuleActionBar";
import type { Company } from "@/lib/types/entities";

export function CompanyDrawerFullEdit({ company }: { company: Company }) {
  const formId = companyDrawerFullFormId(company.id);
  const update = updateCompanyAction.bind(null, company.id);

  return (
    <FormEditingContext.Provider value={true}>
      <form
        id={formId}
        action={update}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
      >
        <CompanyFormFields defaults={company} />
      </form>
    </FormEditingContext.Provider>
  );
}

export function companyDrawerFullFormId(companyId: number): string {
  return `company-drawer-full-${companyId}`;
}
