"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveOpportunityCommissionAction } from "@/app/admin/opportunities/workspaceActions";
import { contactsForCompany } from "@/lib/contactCompanyFilter";
import { resolveCompanySelectValue, resolveContactSelectValue, toLegacyCompanySelectOptions, toLegacyContactSelectOptions } from "@/lib/crmSelectOptions";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";
import type { CompanyOption } from "@/lib/repos/companies";

const inputClass = "mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900";
const labelClass = "text-[10px] font-semibold uppercase tracking-wide text-slate-500";
const money = (value: number) => new Intl.NumberFormat("en-HK", { style: "currency", currency: "HKD", maximumFractionDigits: 2 }).format(value);
const n = (value: string | null | undefined) => Number.parseFloat(value || "0") || 0;

export function OpportunityCommissionSection({ data }: { data: OpportunityDetailData }) {
  const { opportunity, commission, companies, contacts } = data;
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [companyId, setCompanyId] = useState(resolveCompanySelectValue(companies as CompanyOption[], commission?.payout_company_id));
  const [draft, setDraft] = useState({
    seller: commission?.fee_from_seller ?? "", buyer: commission?.fee_from_buyer ?? "",
    operator: commission?.fee_from_operator_landlord ?? "", tenant: commission?.fee_from_tenant ?? "",
    payout: commission?.payout_amount ?? "",
  });
  const availableContacts = useMemo(() => contactsForCompany(contacts, companyId, companies as CompanyOption[]), [contacts, companyId, companies]);
  const income = n(draft.seller) + n(draft.buyer) + n(draft.operator) + n(draft.tenant);
  const profit = income - n(draft.payout);
  const companyOptions = toLegacyCompanySelectOptions(companies as CompanyOption[]);
  const contactOptions = toLegacyContactSelectOptions(availableContacts);

  return (
    <section className="rounded-xl border border-[#d9d2c7] bg-[#fbfaf7] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[#6f665a]">Commission</h2>
          <p className="mt-0.5 text-xs text-slate-500">Income, payout and opportunity profit</p>
        </div>
        <button type="button" onClick={() => setEditing((v) => !v)} className="rounded-lg border border-[#cfc5b7] bg-white px-3 py-1.5 text-xs font-semibold text-[#665c50] hover:bg-[#f0ebe4]">
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>
      {editing ? (
        <form className="mt-3" action={(formData) => startTransition(async () => { await saveOpportunityCommissionAction(opportunity.id, formData); setEditing(false); router.refresh(); })}>
          <div className="grid gap-2 sm:grid-cols-2">
            {[["Fee from Seller", "fee_from_seller", "seller"], ["Fee from Buyer", "fee_from_buyer", "buyer"], ["Fee from Operator / Landlord", "fee_from_operator_landlord", "operator"], ["Fee from Tenant", "fee_from_tenant", "tenant"]].map(([label, name, key]) => (
              <label key={name}><span className={labelClass}>{label} (HKD)</span><input className={inputClass} type="number" step="0.01" name={name} value={draft[key as keyof typeof draft]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} /></label>
            ))}
            <label><span className={labelClass}>Payout Amount (HKD)</span><input className={inputClass} type="number" step="0.01" name="payout_amount" value={draft.payout} onChange={(e) => setDraft({ ...draft, payout: e.target.value })} /></label>
            <label><span className={labelClass}>Payout Company</span><select className={inputClass} name="payout_company_id" value={companyId} onChange={(e) => setCompanyId(e.target.value)}><option value="">—</option>{companyOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
            <label><span className={labelClass}>Payout Contact</span><select className={inputClass} name="payout_contact_id" defaultValue={resolveContactSelectValue(contacts, commission?.payout_contact_id)}><option value="">—</option>{contactOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
            <label><span className={labelClass}>Remarks</span><input className={inputClass} name="remarks" defaultValue={commission?.remarks ?? ""} /></label>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-[#ddd5ca]"><span className={labelClass}>Calculated profit</span><strong className={profit < 0 ? "text-rose-700" : "text-emerald-700"}>{money(profit)}</strong></div>
          <button disabled={pending} className="mt-3 rounded-lg bg-[#776b5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#655b51] disabled:opacity-50">{pending ? "Saving…" : "Save Commission"}</button>
        </form>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div><p className={labelClass}>Total fees</p><p className="mt-1 text-base font-semibold text-slate-900">{money(income)}</p></div>
          <div><p className={labelClass}>Payout</p><p className="mt-1 text-base font-semibold text-slate-900">{money(n(draft.payout))}</p><p className="truncate text-xs text-slate-500">{commission?.payout_contact_name || commission?.payout_company_name || "—"}</p></div>
          <div><p className={labelClass}>Profit</p><p className={`mt-1 text-lg font-bold ${profit < 0 ? "text-rose-700" : "text-emerald-700"}`}>{money(profit)}</p></div>
        </div>
      )}
    </section>
  );
}
