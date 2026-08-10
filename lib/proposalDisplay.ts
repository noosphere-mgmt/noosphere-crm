import type { ProposalStatus } from "@/lib/types/entities";

export function proposalStatusLabel(status: ProposalStatus): string {
  const labels: Record<ProposalStatus, string> = {
    draft: "Draft",
    sent: "Sent",
    accepted: "Accepted",
    superseded: "Superseded",
  };
  return labels[status] ?? status;
}
