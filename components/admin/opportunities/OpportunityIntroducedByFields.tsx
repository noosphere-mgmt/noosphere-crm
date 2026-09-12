"use client";

import { useMemo, useState } from "react";
import { OpportunityPartyContactSelect } from "@/components/admin/opportunities/OpportunityPartyContactSelect";
import { OptionTypeahead } from "@/components/admin/OptionTypeahead";
import { labelClass, selectClass } from "@/components/admin/opportunities/OpportunityRequirementFields";
import {
  resolveCompanySelectValue,
  resolveContactSelectValue,
  toLegacyContactSelectOptions,
} from "@/lib/crmSelectOptions";
import { companyTypeaheadOptions } from "@/lib/typeaheadOptions";
import type { CompanyOption } from "@/lib/repos/companies";
import type { ContactOption } from "@/lib/repos/contacts";
import type { Opportunity } from "@/lib/types/entities";

export function introducedByDisplayName(opportunity: Pick<
  Opportunity,
  "referrer_contact_name" | "referrer_company_name"
>): string {
  return (
    opportunity.referrer_contact_name?.trim() ||
    opportunity.referrer_company_name?.trim() ||
    "Direct / not recorded"
  );
}

export function OpportunityIntroducedByFields({
  companies,
  contacts,
  defaultCompanyId,
  defaultContactId,
  disabled = false,
  instanceKey,
}: {
  companies: CompanyOption[];
  contacts: ContactOption[];
  defaultCompanyId?: number | null;
  defaultContactId?: number | null;
  disabled?: boolean;
  instanceKey: string;
}) {
  const companyOptions = useMemo(() => companyTypeaheadOptions(companies), [companies]);
  const contactOptions = useMemo(() => toLegacyContactSelectOptions(contacts), [contacts]);
  const [companyId, setCompanyId] = useState(
    resolveCompanySelectValue(companies, defaultCompanyId),
  );

  return (
    <>
      <OptionTypeahead
        label="Introduced by company"
        name="referrer_company_id"
        value={companyId}
        onChange={setCompanyId}
        options={companyOptions}
        instanceKey={instanceKey}
        placeholder="Search company…"
        emptyLabel="— Direct / none —"
        allowEmpty
        disabled={disabled}
        inputClassName={selectClass}
        labelClassName={labelClass}
      />
      <OpportunityPartyContactSelect
        instanceKey={`${instanceKey}-${companyId}`}
        companyId={companyId}
        contacts={contacts}
        companies={companies}
        contactOptions={contactOptions}
        defaultContactId={resolveContactSelectValue(contacts, defaultContactId)}
        fieldName="referrer_contact_id"
        disabled={disabled}
        emptyLabel="— Direct / none —"
        label="Introduced by contact"
      />
    </>
  );
}
