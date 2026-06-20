"use client";

import { useEffect, useMemo, useState } from "react";
import { contactsForCompany } from "@/lib/contactCompanyFilter";
import type { ContactOption } from "@/lib/repos/contacts";

const selectClass = "mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm";

export function OpportunityPartyContactSelect({
  companyId,
  contacts,
  defaultContactId,
  onNewContact,
  instanceKey,
  fieldName = "contact_id",
}: {
  companyId: string;
  contacts: ContactOption[];
  defaultContactId?: string;
  onNewContact: () => void;
  instanceKey: string;
  fieldName?: string;
}) {
  const filtered = useMemo(() => contactsForCompany(contacts, companyId), [contacts, companyId]);
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
      const ok = filtered.some((c) => String(c.id) === current);
      return ok ? current : "";
    });
  }, [companyId, filtered]);

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
        {filtered.map((c) => (
          <option key={c.id} value={c.id}>
            {c.contact_name}
          </option>
        ))}
      </select>
    </div>
  );
}
