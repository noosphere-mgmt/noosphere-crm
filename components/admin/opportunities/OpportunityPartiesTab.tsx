"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  createOpportunityPartyAction,
  deleteOpportunityPartyAction,
  updateOpportunityPartyAction,
} from "@/app/admin/opportunities/workspaceActions";
import { FormField, TextAreaField } from "@/components/admin/AdminFormFields";
import { ContactFormDrawer } from "@/components/admin/connections/ContactFormDrawer";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { OpportunityPartyContactSelect } from "@/components/admin/opportunities/OpportunityPartyContactSelect";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { companyFullPageHref, contactFullPageHref } from "@/lib/crmDetailNav";
import {
  FEE_STATUSES,
  FEE_STATUS_LABELS,
  OPPORTUNITY_PARTY_ROLES,
} from "@/lib/opportunityValues";
import { formatPartyFeeCell, partyRoleLabel } from "@/lib/opportunityPartiesDisplay";
import { toLegacyCompanySelectOptions, toLegacyContactSelectOptions, resolveCompanySelectValue, resolveContactSelectValue } from "@/lib/crmSelectOptions";
import type { CompanyOption } from "@/lib/repos/companies";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";
import type { OpportunityParty } from "@/lib/types/entities";

const selectClass = "mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm";

export function OpportunityPartiesTab({ data }: { data: OpportunityDetailData }) {
  const router = useRouter();
  const theme = moduleAccentClasses("opportunities");
  const { opportunity, parties, companies, contacts } = data;
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [contactDrawerOpen, setContactDrawerOpen] = useState(false);
  const [contactDrawerCompanyId, setContactDrawerCompanyId] = useState<number | undefined>();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const editingParty = useMemo(() => {
    if (editingId === "new") return null;
    if (editingId == null) return null;
    return parties.find((p) => p.id === editingId) ?? null;
  }, [editingId, parties]);

  const partiesReturnTo = `/admin/opportunities/${opportunity.id}?tab=parties`;

  function PartyForm({ party }: { party?: OpportunityParty }) {
    const companyOptions = useMemo(
      () => toLegacyCompanySelectOptions(companies as CompanyOption[]),
      [companies],
    );
    const contactOptions = useMemo(
      () => toLegacyContactSelectOptions(contacts),
      [contacts],
    );
    const [companyId, setCompanyId] = useState(
      resolveCompanySelectValue(companies as CompanyOption[], party?.company_id),
    );
    const [showFees, setShowFees] = useState(Boolean(
      party?.collect_fee_amount || party?.collect_fee_percent || party?.paid_out_fee_amount || party?.paid_out_fee_percent ||
      (party?.collect_fee_status && party.collect_fee_status !== "expected"),
    ));
    const action =
      party != null
        ? updateOpportunityPartyAction.bind(null, party.id)
        : createOpportunityPartyAction.bind(null, opportunity.id);

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("opportunity_id", String(opportunity.id));
          startTransition(async () => {
            setSaveMessage(null);
            setSaveError(null);
            try {
              await action(fd);
              router.refresh();
              setEditingId(null);
              setSaveMessage(party ? "Party updated." : "Company and contact linked to this opportunity.");
            } catch (error) {
              setSaveError(error instanceof Error ? error.message : "The party could not be saved.");
            }
          });
        }}
        className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm">
            <span className="text-xs font-medium uppercase text-slate-500">Company</span>
            <select
              name="company_id"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              required
              className={selectClass}
            >
              <option value="">— Select —</option>
              {companyOptions.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <OpportunityPartyContactSelect
            instanceKey={`party-${party?.id ?? "new"}-${companyId}`}
            companyId={companyId}
            contacts={contacts}
            companies={companies as CompanyOption[]}
            contactOptions={contactOptions}
            defaultContactId={resolveContactSelectValue(contacts, party?.contact_id)}
            onNewContact={() => {
              const legacyId = (companies as CompanyOption[]).find((c) => c.business_id === companyId)?.id;
              if (legacyId != null && legacyId > 0) {
                setContactDrawerCompanyId(legacyId);
                setContactDrawerOpen(true);
              }
            }}
          />
          <label className="block text-sm">
            <span className="text-xs font-medium uppercase text-slate-500">Role</span>
            <select name="role" defaultValue={party?.role ?? "agent"} className={selectClass}>
              {party?.role && !(OPPORTUNITY_PARTY_ROLES as readonly string[]).includes(party.role) ? (
                <option value={party.role}>Historical: {partyRoleLabel(party.role)}</option>
              ) : null}
              {OPPORTUNITY_PARTY_ROLES.map((r) => (
                <option key={r} value={r}>{partyRoleLabel(r)}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={() => setShowFees((open) => !open)} className="mb-0.5 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-sm font-medium text-violet-800 hover:bg-violet-50">
              {showFees ? "Hide fee arrangement" : "+ Fee arrangement"}
            </button>
          </div>
          {showFees ? (
            <div className="grid gap-3 rounded-lg border border-violet-100 bg-white p-3 sm:col-span-2 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-5">
              <label className="block text-sm">
                <span className="text-xs font-medium uppercase text-slate-500">Collect Status</span>
                <select name="collect_fee_status" defaultValue={party?.collect_fee_status ?? "expected"} className={selectClass}>
                  {FEE_STATUSES.map((s) => <option key={s} value={s}>{FEE_STATUS_LABELS[s]}</option>)}
                </select>
              </label>
              <FormField label="Collect Amount" name="collect_fee_amount" type="number" defaultValue={party?.collect_fee_amount ?? ""} />
              <FormField label="Collect %" name="collect_fee_percent" type="number" defaultValue={party?.collect_fee_percent ?? ""} />
              <FormField label="Pay Out Amount" name="paid_out_fee_amount" type="number" defaultValue={party?.paid_out_fee_amount ?? ""} />
              <FormField label="Pay Out %" name="paid_out_fee_percent" type="number" defaultValue={party?.paid_out_fee_percent ?? ""} />
            </div>
          ) : party ? (
            <>
              <input type="hidden" name="collect_fee_status" value={party.collect_fee_status ?? "expected"} />
              <input type="hidden" name="collect_fee_amount" value={party.collect_fee_amount ?? ""} />
              <input type="hidden" name="collect_fee_percent" value={party.collect_fee_percent ?? ""} />
              <input type="hidden" name="paid_out_fee_amount" value={party.paid_out_fee_amount ?? ""} />
              <input type="hidden" name="paid_out_fee_percent" value={party.paid_out_fee_percent ?? ""} />
            </>
          ) : null}
          <div className="sm:col-span-2 lg:col-span-3">
            <TextAreaField label="Remarks" name="remarks" defaultValue={party?.remarks ?? ""} />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={theme.primaryButton}>
            Save
          </button>
          <button type="button" onClick={() => setEditingId(null)} className="rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50/40 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">People, channel and commercial roles</h2>
          <p className="mt-0.5 text-xs text-slate-500">Record the client, referrer, agent, operator, landlord or service partner involved in this opportunity.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-semibold text-violet-900">{parties.length}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Linked parties</p>
          </div>
          <button type="button" onClick={() => setEditingId("new")} className={theme.primaryButton}>
            + Add party
          </button>
        </div>
      </div>

      {saveMessage ? (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          {saveMessage}
        </div>
      ) : null}
      {saveError ? (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
          {saveError}
        </div>
      ) : null}

      {editingId === "new" ? <PartyForm /> : null}
      {editingParty ? <PartyForm party={editingParty} /> : null}

      <section className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-stretch">
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Introduced by</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{opportunity.referrer_contact_name ?? opportunity.referrer_company_name ?? "Direct / not recorded"}</p>
          {opportunity.referrer_contact_name && opportunity.referrer_company_name ? <p className="text-xs text-slate-600">{opportunity.referrer_company_name}</p> : null}
        </div>
        <div className="hidden items-center text-slate-300 sm:flex" aria-hidden>→</div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Client</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {opportunity.primary_contact_name ? (
              <AdminEntityLink
                href={contactFullPageHref(
                  opportunity.primary_contact_business_id ?? opportunity.primary_contact_id,
                )}
                className="underline-offset-2 hover:underline"
              >
                {opportunity.primary_contact_name}
              </AdminEntityLink>
            ) : (
              opportunity.client_name
            )}
          </p>
          {opportunity.linked_company_name ? (
            <p className="text-xs text-slate-600">
              <AdminEntityLink
                href={companyFullPageHref(
                  opportunity.linked_company_business_id ?? opportunity.company_id,
                )}
                className="underline-offset-2 hover:underline"
              >
                {opportunity.linked_company_name}
              </AdminEntityLink>
            </p>
          ) : null}
        </div>
        <div className="hidden items-center text-slate-300 sm:flex" aria-hidden>→</div>
        <div className="rounded-xl border border-sky-200 bg-sky-50/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">Supporting parties</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{parties.length} linked</p>
          <p className="truncate text-xs text-slate-600">{parties.slice(0, 3).map((party) => party.company_name).filter(Boolean).join(" · ") || "Add agents, operators or partners"}</p>
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-1.5 font-medium">Company</th>
              <th className="px-3 py-1.5 font-medium">Contact</th>
              <th className="px-3 py-1.5 font-medium">Role</th>
              <th className="px-3 py-1.5 font-medium">Collect fee</th>
              <th className="px-3 py-1.5 font-medium">Paid out fee</th>
              <th className="px-3 py-1.5 font-medium">Remarks</th>
              <th className="w-24 px-3 py-1.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parties.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No parties linked to this opportunity yet.
                </td>
              </tr>
            ) : (
              parties.map((party) => (
                <tr key={party.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-1.5 text-slate-900">{(() => {
                    const href = companyFullPageHref(resolveCompanySelectValue(companies as CompanyOption[], party.company_id));
                    return href ? <Link href={href} className="font-medium text-violet-900 hover:underline">{party.company_name ?? "View company"}</Link> : party.company_name ?? "—";
                  })()}</td>
                  <td className="px-3 py-1.5 text-slate-700">{(() => {
                    const href = contactFullPageHref(resolveContactSelectValue(contacts, party.contact_id));
                    return href ? <Link href={href} className="text-violet-900 hover:underline">{party.contact_name ?? "View contact"}</Link> : party.contact_name ?? "—";
                  })()}</td>
                  <td className="px-3 py-1.5 text-slate-700">{partyRoleLabel(party.role)}</td>
                  <td className="px-3 py-1.5 text-slate-700">
                    {formatPartyFeeCell(party.collect_fee_amount, party.collect_fee_percent)}
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">
                    {formatPartyFeeCell(party.paid_out_fee_amount, party.paid_out_fee_percent)}
                  </td>
                  <td className="max-w-[10rem] truncate px-3 py-1.5 text-slate-600" title={party.remarks ?? ""}>
                    {party.remarks ?? "—"}
                  </td>
                  <td className="px-3 py-1.5">
                    <ModuleRowActions
                      module="opportunities"
                      onEdit={() => setEditingId(party.id)}
                      onDelete={() =>
                        startTransition(async () => {
                          setSaveMessage(null);
                          setSaveError(null);
                          try {
                            await deleteOpportunityPartyAction(opportunity.id, party.id);
                            router.refresh();
                            setSaveMessage("Party removed from this opportunity.");
                          } catch (error) {
                            setSaveError(error instanceof Error ? error.message : "The party could not be removed.");
                          }
                        })
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ContactFormDrawer
        open={contactDrawerOpen}
        onClose={() => setContactDrawerOpen(false)}
        companies={companies}
        fixedCompanyId={contactDrawerCompanyId}
        returnTo={partiesReturnTo}
      />
    </div>
  );
}
