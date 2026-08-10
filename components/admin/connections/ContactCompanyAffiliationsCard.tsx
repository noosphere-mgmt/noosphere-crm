"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addContactCompanyAffiliationAction,
  removeContactCompanyAffiliationAction,
  setPrimaryContactCompanyAffiliationAction,
} from "@/app/admin/contacts/affiliationActions";
import { toLegacyCompanySelectOptions } from "@/lib/crmSelectOptions";
import { companyFullPageHref } from "@/lib/crmDetailNav";
import type { CompanyOption } from "@/lib/repos/companies";
import type { ContactCompanyAffiliation } from "@/lib/repos/contactCompanyAffiliations";

export function ContactCompanyAffiliationsCard({
  contactId,
  affiliations,
  companies,
}: {
  contactId: number;
  affiliations: ContactCompanyAffiliation[];
  companies: CompanyOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [role, setRole] = useState("");
  const [isPrimary, setIsPrimary] = useState(affiliations.length === 0);
  const options = toLegacyCompanySelectOptions(companies);
  const linked = new Set(
    affiliations
      .map((a) => a.company_business_id?.trim() || String(a.company_id))
      .filter(Boolean),
  );
  const available = options.filter((o) => !linked.has(o.value));

  function refresh() {
    router.refresh();
  }

  function onAdd() {
    if (!companyId) {
      setError("Select a company");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addContactCompanyAffiliationAction(contactId, {
        company_id: companyId,
        job_title: jobTitle,
        role,
        is_primary: isPrimary || affiliations.length === 0,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCompanyId("");
      setJobTitle("");
      setRole("");
      setIsPrimary(false);
      refresh();
    });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Company affiliations</h3>
        <p className="text-xs text-slate-500">A contact may belong to multiple companies</p>
      </div>

      {error ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      {affiliations.length === 0 ? (
        <p className="mb-3 text-sm text-slate-500">No companies linked yet.</p>
      ) : (
        <ul className="mb-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {affiliations.map((row) => {
            const href = companyFullPageHref(row.company_business_id);
            return (
              <li key={row.id} className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {href ? (
                      <a href={href} className="font-medium text-[#5B21B6] hover:underline">
                        {row.company_name}
                      </a>
                    ) : (
                      <span className="font-medium text-slate-900">{row.company_name}</span>
                    )}
                    {row.company_business_id ? (
                      <span className="font-mono text-xs text-slate-500">{row.company_business_id}</span>
                    ) : null}
                    {row.is_primary ? (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                        Primary
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {[row.job_title, row.role].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!row.is_primary ? (
                    <button
                      type="button"
                      disabled={pending}
                      className="text-xs font-medium text-slate-600 hover:underline"
                      onClick={() =>
                        startTransition(async () => {
                          const r = await setPrimaryContactCompanyAffiliationAction(contactId, row.id);
                          if (!r.ok) setError(r.error);
                          else refresh();
                        })
                      }
                    >
                      Make primary
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={pending}
                    className="text-xs font-medium text-red-700 hover:underline"
                    onClick={() =>
                      startTransition(async () => {
                        const r = await removeContactCompanyAffiliationAction(contactId, row.id);
                        if (!r.ok) setError(r.error);
                        else refresh();
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
          Company
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
          >
            <option value="">Select company…</option>
            {available.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Job title
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Role
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={isPrimary || affiliations.length === 0}
            onChange={(e) => setIsPrimary(e.target.checked)}
            disabled={affiliations.length === 0}
          />
          Primary company
        </label>
        <button
          type="button"
          disabled={pending || !companyId}
          onClick={onAdd}
          className="rounded-lg bg-[#5B21B6] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4C1D95] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Add company"}
        </button>
      </div>
    </section>
  );
}
