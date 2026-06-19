"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createOpportunityPartyAction,
  deleteOpportunityPartyAction,
  updateOpportunityPartyAction,
} from "@/app/admin/opportunities/workspaceActions";
import { FormField, TextAreaField } from "@/components/admin/AdminFormFields";
import { ContactFormDrawer } from "@/components/admin/connections/ContactFormDrawer";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { OpportunityPartyContactSelect } from "@/components/admin/opportunities/OpportunityPartyContactSelect";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import {
  FEE_STATUSES,
  FEE_STATUS_LABELS,
  OPPORTUNITY_PARTNERSHIP_MODES,
  OPPORTUNITY_PARTNERSHIP_MODE_LABELS,
  OPPORTUNITY_PARTY_ROLES,
} from "@/lib/opportunityValues";
import { formatPartyFeeCell, partyRoleLabel } from "@/lib/opportunityPartiesDisplay";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";
import type { OpportunityParty } from "@/lib/types/entities";

const selectClass = "mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm";

export function OpportunityPartiesTab({ data }: { data: OpportunityDetailData }) {
  const theme = moduleAccentClasses("opportunities");
  const { opportunity, parties, companies, contacts } = data;
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [contactDrawerOpen, setContactDrawerOpen] = useState(false);
  const [contactDrawerCompanyId, setContactDrawerCompanyId] = useState<number | undefined>();
  const [pending, startTransition] = useTransition();

  const editingParty = useMemo(() => {
    if (editingId === "new") return null;
    if (editingId == null) return null;
    return parties.find((p) => p.id === editingId) ?? null;
  }, [editingId, parties]);

  const partiesReturnTo = `/admin/opportunities/${opportunity.id}?tab=parties`;

  function PartyForm({ party }: { party?: OpportunityParty }) {
    const [companyId, setCompanyId] = useState(party?.company_id?.toString() ?? "");
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
            await action(fd);
            setEditingId(null);
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
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </label>
          <OpportunityPartyContactSelect
            instanceKey={`party-${party?.id ?? "new"}-${companyId}`}
            companyId={companyId}
            contacts={contacts}
            defaultContactId={party?.contact_id?.toString()}
            onNewContact={() => {
              const cid = Number.parseInt(companyId, 10);
              if (Number.isFinite(cid) && cid > 0) {
                setContactDrawerCompanyId(cid);
                setContactDrawerOpen(true);
              }
            }}
          />
          <label className="block text-sm">
            <span className="text-xs font-medium uppercase text-slate-500">Role</span>
            <select name="role" defaultValue={party?.role ?? "end_user"} className={selectClass}>
              {OPPORTUNITY_PARTY_ROLES.map((r) => (
                <option key={r} value={r}>{partyRoleLabel(r)}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium uppercase text-slate-500">Partnership mode</span>
            <select name="partnership_mode" defaultValue={party?.partnership_mode ?? ""} className={selectClass}>
              <option value="">—</option>
              {OPPORTUNITY_PARTNERSHIP_MODES.map((m) => (
                <option key={m} value={m}>{OPPORTUNITY_PARTNERSHIP_MODE_LABELS[m]}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium uppercase text-slate-500">Collect status</span>
            <select name="collect_fee_status" defaultValue={party?.collect_fee_status ?? "expected"} className={selectClass}>
              {FEE_STATUSES.map((s) => (
                <option key={s} value={s}>{FEE_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </label>
          <FormField label="Collect fee amount" name="collect_fee_amount" type="number" defaultValue={party?.collect_fee_amount ?? ""} />
          <FormField label="Collect fee %" name="collect_fee_percent" type="number" defaultValue={party?.collect_fee_percent ?? ""} />
          <FormField label="Paid out amount" name="paid_out_fee_amount" type="number" defaultValue={party?.paid_out_fee_amount ?? ""} />
          <FormField label="Paid out %" name="paid_out_fee_percent" type="number" defaultValue={party?.paid_out_fee_percent ?? ""} />
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
      <button
        type="button"
        onClick={() => setEditingId("new")}
        className={theme.primaryButton}
      >
        + Add party
      </button>

      {editingId === "new" ? <PartyForm /> : null}
      {editingParty ? <PartyForm party={editingParty} /> : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-1.5 font-medium">Company</th>
              <th className="px-3 py-1.5 font-medium">Contact</th>
              <th className="px-3 py-1.5 font-medium">Role</th>
              <th className="px-3 py-1.5 font-medium">Partnership mode</th>
              <th className="px-3 py-1.5 font-medium">Collect fee</th>
              <th className="px-3 py-1.5 font-medium">Paid out fee</th>
              <th className="px-3 py-1.5 font-medium">Remarks</th>
              <th className="w-24 px-3 py-1.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parties.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No parties linked to this opportunity yet.
                </td>
              </tr>
            ) : (
              parties.map((party) => (
                <tr key={party.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-1.5 text-slate-900">{party.company_name ?? "—"}</td>
                  <td className="px-3 py-1.5 text-slate-700">{party.contact_name ?? "—"}</td>
                  <td className="px-3 py-1.5 text-slate-700">{partyRoleLabel(party.role)}</td>
                  <td className="px-3 py-1.5 text-slate-700">
                    {party.partnership_mode
                      ? OPPORTUNITY_PARTNERSHIP_MODE_LABELS[
                          party.partnership_mode as keyof typeof OPPORTUNITY_PARTNERSHIP_MODE_LABELS
                        ] ?? party.partnership_mode
                      : "—"}
                  </td>
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
                          await deleteOpportunityPartyAction(opportunity.id, party.id);
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
