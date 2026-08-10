"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteOpportunityDocumentAction, uploadOpportunityDocumentAction } from "@/app/admin/opportunities/documentActions";
import { deleteGeneratedProposalDocumentAction } from "@/app/admin/opportunities/proposalActions";
import { IconTrash } from "@/components/admin/ModuleActionIcons";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

const CATEGORY_LABELS: Record<string, string> = {
  client_file: "Client File",
  agreement: "Agreement",
  proposal: "Proposal",
  property_document: "Property Document",
  invoice: "Invoice",
  other: "Other",
};

function formatBytes(value: number): string {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function OpportunityDocumentsTab({ data }: { data: OpportunityDetailData; proposalsEnabled?: boolean }) {
  const { opportunity, proposals, documents } = data;
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const generated = proposals.filter((proposal) => proposal.output_file && proposal.status !== "superseded");

  function submitUpload(formData: FormData) {
    startTransition(async () => {
      setMessage(null);
      const result = await uploadOpportunityDocumentAction(opportunity.id, formData);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      formRef.current?.reset();
      setUploadOpen(false);
      setMessage("Document uploaded.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <p className="text-sm text-slate-600">View and download opportunity documents.</p>
        <button type="button" onClick={() => setUploadOpen((open) => !open)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-800">
          {uploadOpen ? "Close upload" : "Upload document"}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Document repository</h2>
            <p className="mt-1 text-xs text-slate-500">Uploaded files and CRM-generated proposal PDFs.</p>
          </div>

          {documents.length === 0 && generated.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-slate-500">No documents filed for this opportunity yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((document) => (
                <article key={`upload-${document.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-slate-900">{document.title}</p>
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800 ring-1 ring-sky-100">Uploaded</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {CATEGORY_LABELS[document.category] ?? document.category} · {formatBytes(document.file_size)} · {document.created_at.slice(0, 10)}
                    </p>
                    {document.notes ? <p className="mt-1 line-clamp-1 text-xs text-slate-600">{document.notes}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a href={`/api/admin/opportunity-documents/${document.id}`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">View</a>
                    <button type="button" disabled={pending} onClick={() => {
                      if (!window.confirm(`Delete “${document.title}”? This cannot be undone.`)) return;
                      startTransition(async () => {
                        await deleteOpportunityDocumentAction(document.id);
                        router.refresh();
                      });
                    }} className="inline-flex rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50 disabled:opacity-40" aria-label={`Delete ${document.title}`} title="Delete uploaded document"><IconTrash /></button>
                  </div>
                </article>
              ))}

              {generated.map((proposal) => (
                <article key={`proposal-${proposal.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-slate-900">{proposal.title || `Proposal v${proposal.version_number}`}</p>
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-800 ring-1 ring-violet-100">System Generated</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">Version {proposal.version_number} · {proposal.language} · {proposal.created_at.slice(0, 10)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a href={`/api/admin/proposals/${proposal.id}/pdf`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">View</a>
                    <button type="button" disabled={pending} onClick={() => {
                      if (!window.confirm(`Delete “${proposal.title || `Proposal v${proposal.version_number}`}”? This removes the generated PDF and proposal version and cannot be undone.`)) return;
                      startTransition(async () => {
                        await deleteGeneratedProposalDocumentAction(proposal.id);
                        router.refresh();
                      });
                    }} className="inline-flex rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50 disabled:opacity-40" aria-label={`Delete ${proposal.title || `Proposal v${proposal.version_number}`}`} title="Delete generated document"><IconTrash /></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={`${uploadOpen ? "block" : "hidden"} rounded-xl border border-rose-200 bg-rose-50/30 p-4 lg:sticky lg:top-4 lg:block`}>
          <h2 className="text-sm font-semibold text-slate-900">Upload document</h2>
          <p className="mt-1 text-xs text-slate-500">PDF, JPG or PNG · maximum 20 MB</p>
          <form ref={formRef} action={submitUpload} className="mt-4 space-y-3">
            <label className="block text-sm"><span className="mb-1 block text-xs font-medium text-slate-600">Document file</span><input type="file" name="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" required className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-rose-800" /></label>
            <label className="block text-sm"><span className="mb-1 block text-xs font-medium text-slate-600">Document title</span><input name="title" placeholder="Defaults to file name" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" /></label>
            <label className="block text-sm"><span className="mb-1 block text-xs font-medium text-slate-600">Category</span><select name="category" defaultValue="client_file" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="block text-sm"><span className="mb-1 block text-xs font-medium text-slate-600">Notes</span><textarea name="notes" rows={3} className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" /></label>
            <button type="submit" disabled={pending} className="w-full rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50">{pending ? "Uploading…" : "Upload document"}</button>
          </form>
          {message ? <p className={`mt-3 text-xs ${message === "Document uploaded." ? "text-emerald-700" : "text-red-700"}`}>{message}</p> : null}
        </section>
      </div>
    </div>
  );
}
