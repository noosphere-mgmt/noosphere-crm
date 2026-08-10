"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  generateProposalPdfAction,
  getProposalDetailAction,
  markProposalSentAction,
  recalculateProposalPricingAction,
  createProposalRevisionAction,
  updateProposalAction,
  updateProposalItemAction,
} from "@/app/admin/opportunities/proposalActions";
import { PROPOSAL_LANGUAGE_OPTIONS } from "@/lib/proposals/i18n";
import { proposalStatusLabel } from "@/lib/proposalDisplay";
import type { Opportunity, OpportunityProposal, OpportunityProposalItem } from "@/lib/types/entities";

export function OpportunityProposalEditor({
  proposalId,
  opportunity,
  onUpdated,
}: {
  proposalId: number;
  opportunity: Opportunity;
  onUpdated: () => void;
}) {
  const [proposal, setProposal] = useState<OpportunityProposal | null>(null);
  const [items, setItems] = useState<OpportunityProposalItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function reload() {
    const detail = await getProposalDetailAction(proposalId);
    if (detail) {
      setProposal(detail.proposal);
      setItems(detail.items);
    }
    onUpdated();
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  if (!proposal) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading proposal…</div>;
  }

  const isDraft = proposal.status === "draft";
  const pdfHref = proposal.output_file ? `/api/admin/proposals/${proposal.id}/pdf` : null;

  function saveHeader(formData: FormData) {
    startTransition(async () => {
      setMessage(null);
      await updateProposalAction(proposalId, formData);
      await reload();
      setMessage("Proposal saved.");
    });
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-emerald-800">{message}</p> : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{proposal.title}</h3>
            <p className="text-sm text-slate-500">
              v{proposal.version_number} · {proposalStatusLabel(proposal.status)}
              {proposal.sent_date ? ` · Sent ${proposal.sent_date.slice(0, 10)}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pdfHref ? (
              <Link
                href={pdfHref}
                target="_blank"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Download PDF
              </Link>
            ) : null}
            {isDraft ? (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await recalculateProposalPricingAction(proposalId);
                      await reload();
                      setMessage("Pricing recalculated.");
                    })
                  }
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Recalculate pricing
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await generateProposalPdfAction(proposalId);
                      await reload();
                      setMessage("PDF generated.");
                    })
                  }
                  className="rounded-lg bg-emerald-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
                >
                  Generate PDF
                </button>
              </>
            ) : null}
            {!isDraft ? (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const { proposalId: newId } = await createProposalRevisionAction(proposalId);
                    window.location.href = `${window.location.pathname}?tab=documents&proposal=${newId}`;
                  })
                }
                className="rounded-lg border border-emerald-700 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
              >
                Create revision
              </button>
            ) : null}
          </div>
        </div>

        <form action={saveHeader} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Title</span>
              <input
                name="title"
                defaultValue={proposal.title}
                disabled={!isDraft}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Date</span>
              <input
                type="date"
                name="proposal_date"
                defaultValue={proposal.proposal_date?.slice(0, 10) ?? ""}
                disabled={!isDraft}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Language</span>
              <select
                name="language"
                defaultValue={proposal.language}
                disabled={!isDraft}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              >
                {PROPOSAL_LANGUAGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Executive summary</span>
            <textarea
              name="executive_summary"
              rows={3}
              defaultValue={proposal.executive_summary ?? ""}
              disabled={!isDraft}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Consultancy advice</span>
            <textarea
              name="consultancy_advice"
              rows={3}
              defaultValue={proposal.consultancy_advice ?? ""}
              disabled={!isDraft}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
            />
          </label>
          {isDraft ? (
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              Save header
            </button>
          ) : null}
        </form>

        {isDraft ? (
          <form
            className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4"
            action={(fd) => {
              startTransition(async () => {
                await markProposalSentAction(proposalId, fd);
                await reload();
                setMessage("Proposal marked as sent.");
              });
            }}
          >
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Sent date</span>
              <input
                type="date"
                name="sent_date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
              <input type="checkbox" name="update_opportunity_status" defaultChecked />
              Update deal status to Awaiting Client Feedback
            </label>
            <button
              type="submit"
              disabled={pending || !proposal.output_file}
              className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100 disabled:opacity-50"
              title={proposal.output_file ? undefined : "Generate PDF first"}
            >
              Mark sent
            </button>
          </form>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Line</th>
              <th className="px-3 py-2 font-medium">Premises</th>
              <th className="px-3 py-2 font-medium">Building</th>
              <th className="px-3 py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No line items. Create a proposal from the Shortlist tab.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <ProposalItemRow
                  key={item.id}
                  item={item}
                  proposalId={proposalId}
                  editable={isDraft}
                  onSaved={reload}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProposalItemRow({
  item,
  proposalId,
  editable,
  onSaved,
}: {
  item: OpportunityProposalItem;
  proposalId: number;
  editable: boolean;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const pid = item.premises_business_id ?? item.premises_snapshot?.premises_business_id ?? item.premises_id;
  const building = item.premises_snapshot?.building_name ?? item.building_name ?? "—";

  function save(formData: FormData) {
    formData.set("proposal_id", String(proposalId));
    startTransition(async () => {
      await updateProposalItemAction(item.id, formData);
      onSaved();
    });
  }

  if (!editable) {
    return (
      <tr className="border-t border-slate-100">
        <td className="px-3 py-2 tabular-nums">{item.rank ?? "—"}</td>
        <td className="px-3 py-2 font-medium">{pid}</td>
        <td className="px-3 py-2">{building}</td>
        <td className="px-3 py-2">
          {item.display_rent ?? "—"}
          {item.recommended ? <span className="ml-2 text-xs text-emerald-700">Recommended</span> : null}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-3 py-2">
        <form action={save} className="space-y-2">
          <input name="rank" defaultValue={item.rank ?? ""} className="w-14 rounded border border-slate-300 px-2 py-1" />
          <input
            name="display_rent"
            defaultValue={item.display_rent ?? ""}
            placeholder="Display rent"
            className="w-full min-w-[120px] rounded border border-slate-300 px-2 py-1"
          />
          <input
            name="net_effective_rent"
            defaultValue={item.net_effective_rent ?? ""}
            placeholder="NER"
            className="w-full rounded border border-slate-300 px-2 py-1"
          />
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" name="recommended" defaultChecked={item.recommended} />
            Recommended
          </label>
          <textarea name="pros" defaultValue={item.pros ?? ""} placeholder="Pros" rows={2} className="w-full min-w-[160px] rounded border border-slate-300 px-2 py-1 text-xs" />
          <textarea name="cons" defaultValue={item.cons ?? ""} placeholder="Cons" rows={2} className="w-full rounded border border-slate-300 px-2 py-1 text-xs" />
          <button type="submit" disabled={pending} className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50">
            Save line
          </button>
        </form>
      </td>
      <td className="px-3 py-2 font-medium">{pid}</td>
      <td className="px-3 py-2">{building}</td>
      <td className="px-3 py-2 text-slate-600">
        {item.premises_snapshot?.display_label ?? "—"}
        {item.premises_snapshot?.property_category ? (
          <div className="text-xs text-slate-400">
            {[item.premises_snapshot.property_category, item.premises_snapshot.space_form].filter(Boolean).join(" · ")}
          </div>
        ) : null}
      </td>
    </tr>
  );
}
