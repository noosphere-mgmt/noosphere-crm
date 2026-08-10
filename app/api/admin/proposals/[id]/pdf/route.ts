import { getProposal, listProposalItems } from "@/lib/repos/opportunityProposals";
import { readProposalPdf } from "@/lib/proposalStorage";

type Props = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { id: raw } = await params;
  const proposalId = Number.parseInt(raw, 10);
  if (!Number.isFinite(proposalId)) return new Response("Not found", { status: 404 });

  const proposal = await getProposal(proposalId);
  if (!proposal?.output_file) return new Response("PDF not generated", { status: 404 });

  const items = await listProposalItems(proposalId);
  if (items.length === 0 && !proposal.executive_summary) {
    return new Response("Empty proposal", { status: 404 });
  }

  const buffer = await readProposalPdf(proposal.output_file);
  if (!buffer) return new Response("File missing", { status: 404 });

  const filename = `proposal-${proposal.id}-v${proposal.version_number}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
