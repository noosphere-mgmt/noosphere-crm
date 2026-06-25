"use client";

import { useEffect, useMemo, useState } from "react";
import { contactsForCompany } from "@/lib/contactCompanyFilter";
import { resolveContactSelectValue, type LegacyContactSelectOption } from "@/lib/crmSelectOptions";
import type { CompanyOption } from "@/lib/repos/companies";
import type { ContactOption } from "@/lib/repos/contacts";

const selectClass = "mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm";

export function OpportunityPartyContactSelect({
  companyId,
  contacts,
  companies,
  contactOptions,
  defaultContactId,
  onNewContact,
  instanceKey,
  fieldName = "contact_id",
}: {
  companyId: string;
  contacts: ContactOption[];
  companies: CompanyOption[];
  contactOptions: LegacyContactSelectOption[];
  defaultContactId?: string;
  onNewContact: () => void;
  instanceKey: string;
  fieldName?: string;
}) {
  const filtered = useMemo(
    () => contactsForCompany(contacts, companyId, companies),
    [contacts, companyId, companies],
  );
  const [contactId, setContactId] = useState(defaultContactId ?? "");

  useEffect(() => {
    setContactId(defaultContactId ?? "");
  }, [instanceKey, defaultContactId]);

  useEffect(() => {
    if (!companyId) {
      setContactId("");
      return;
    }
    setContactId((current) => {
      if (!current) return "";
      const ok = filtered.some((c) => resolveContactSelectValue(contacts, c.id) === current);
      return ok ? current : "";
    });
  }, [companyId, filtered, contacts]);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Contact</span>
        <button
          type="button"
          onClick={onNewContact}
          disabled={!companyId}
          className="text-xs font-medium text-emerald-800 hover:underline disabled:text-slate-400"
        >
          New
        </button>
      </div>
      <select
        name={fieldName}
        value={contactId}
        onChange={(e) => setContactId(e.target.value)}
        disabled={!companyId}
        className={selectClass}
      >
        <option value="">—</option>
        {filtered.map((c) => {
          const value = resolveContactSelectValue(contacts, c.id);
          if (!value) return null;
          const label = contactOptions.find((o) => o.value === value)?.label ?? c.contact_name;
          return (
            <option key={c.id} value={value}>
              {label}
            </option>
          );
        })}
      </select>
    </div>
  );
}
