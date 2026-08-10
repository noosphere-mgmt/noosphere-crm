"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createEmptyProposalAndRedirectAction,
  listOpportunityProposalsAction,
} from "@/app/admin/opportunities/proposalActions";
import { OpportunityProposalEditor } from "@/components/admin/opportunities/OpportunityProposalEditor";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { proposalStatusLabel } from "@/lib/proposalDisplay";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";
import type { OpportunityProposal } from "@/lib/types/entities";

export function OpportunityProposalsTab({
  data,
  proposalsEnabled,
}: {
  data: OpportunityDetailData;
  proposalsEnabled: boolean;
}) {
  const theme = moduleAccentClasses("opportunities");
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = Number.parseInt(searchParams.get("proposal") ?? "", 10);
  const [proposals, setProposals] = useState<OpportunityProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listOpportunityProposalsAction(data.opportunity.id);
      setProposals(rows);
    } finally {
      setLoading(false);
    }
  }, [data.opportunity.id]);

  useEffect(() => {
    if (proposalsEnabled) void load();
  }, [proposalsEnabled, load]);

  if (!proposalsEnabled) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
        Proposal generator is disabled. Set <code className="text-xs">PROPOSALS_ENABLED=1</code> to enable.
      </div>
    );
  }

  function selectProposal(id: number) {
    const base = opportunityWorkspaceHref(data.opportunity, "documents");
    router.push(`${base}&proposal=${id}`);
  }

  function handleNewProposal() {
    startTransition(async () => {
      await createEmptyProposalAndRedirectAction(data.opportunity.id);
    });
  }

  const active = proposals.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={handleNewProposal} disabled={pending} className={theme.primaryButton}>
          + New proposal
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-200 bg-white p-2">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Versions</p>
          {loading ? (
            <p className="px-2 py-4 text-sm text-slate-500">Loading…</p>
          ) : proposals.length === 0 ? (
            <p className="px-2 py-4 text-sm text-slate-500">No proposals yet. Create one from the shortlist or use + New proposal.</p>
          ) : (
            <ul className="space-y-1">
              {proposals.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => selectProposal(p.id)}
                    className={`w-full rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                      p.id === selectedId ? "bg-emerald-50 text-emerald-900" : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="font-medium truncate">{p.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span>v{p.version_number}</span>
                      <span>{proposalStatusLabel(p.status)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="min-w-0">
          {active ? (
            <OpportunityProposalEditor
              key={active.id}
              proposalId={active.id}
              opportunity={data.opportunity}
              onUpdated={load}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center text-sm text-slate-600">
              Select a proposal version or create a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
