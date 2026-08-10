import { formatOpportunityBudget } from "@/lib/opportunityFormParsing";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import { isProfServiceSalesRole } from "@/lib/opportunityValues";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

export type DeskActionLink = {
  label: string;
  href: string;
  detail?: string;
};

export type DeskPendingItem = {
  label: string;
  href: string;
};

function requirementsIncomplete(data: OpportunityDetailData): boolean {
  const { opportunity } = data;
  if (isProfServiceSalesRole(opportunity.sales_role)) {
    return !opportunity.requirement_summary?.trim();
  }
  const budget = formatOpportunityBudget(opportunity.budget_max, opportunity.budget_min);
  return !opportunity.district_preference?.trim() || budget === "—";
}

export function deriveNextAction(
  data: OpportunityDetailData,
  proposalsEnabled: boolean,
): DeskActionLink {
  const { opportunity, proposedPremises, proposals } = data;

  if (isProfServiceSalesRole(opportunity.sales_role)) {
    return {
      label: "Add communication note",
      href: opportunityWorkspaceHref(opportunity, "timeline"),
    };
  }

  const activeProposals = proposals.filter((p) => p.status !== "superseded");
  const draft = activeProposals.find((p) => p.status === "draft");

  if (proposalsEnabled && draft) {
    return {
      label: "Send proposal to client",
      href: `${opportunityWorkspaceHref(opportunity, "documents")}&proposal=${draft.id}`,
      detail: `${draft.title} · v${draft.version_number} draft`,
    };
  }

  if (requirementsIncomplete(data)) {
    return {
      label: "Complete requirements",
      href: opportunityWorkspaceHref(opportunity, "overview", "edit"),
    };
  }

  if (proposedPremises.length === 0) {
    return {
      label: "Add proposed properties",
      href: opportunityWorkspaceHref(opportunity, "proposed"),
    };
  }

  if (proposalsEnabled && activeProposals.length === 0) {
    return {
      label: "Create proposal document",
      href: opportunityWorkspaceHref(opportunity, "documents"),
      detail: `${proposedPremises.length} properties proposed`,
    };
  }

  const sent = activeProposals.find((p) => p.status === "sent");
  if (sent || opportunity.status === "proposal_reviewing") {
    return {
      label: "Follow up with client",
      href: opportunityWorkspaceHref(opportunity, "timeline"),
      detail: sent?.sent_date ? `Proposal sent ${sent.sent_date.slice(0, 10)}` : undefined,
    };
  }

  return {
    label: "Add communication note",
    href: opportunityWorkspaceHref(opportunity, "timeline"),
  };
}

export function collectPendingItems(
  data: OpportunityDetailData,
  proposalsEnabled: boolean,
): DeskPendingItem[] {
  const { opportunity, proposedPremises, proposals, activities } = data;
  const items: DeskPendingItem[] = [];

  if (isProfServiceSalesRole(opportunity.sales_role)) {
    if (activities.length === 0) {
      items.push({
        label: "No notes logged",
        href: opportunityWorkspaceHref(opportunity, "timeline"),
      });
    }
    return items;
  }

  if (requirementsIncomplete(data)) {
    items.push({
      label: "Requirements incomplete",
      href: opportunityWorkspaceHref(opportunity, "overview", "edit"),
    });
  }

  const activeProposals = proposals.filter((p) => p.status !== "superseded");
  const draft = activeProposals.find((p) => p.status === "draft");
  if (proposalsEnabled && draft) {
    items.push({
      label: `Draft proposal · v${draft.version_number}`,
      href: `${opportunityWorkspaceHref(opportunity, "documents")}&proposal=${draft.id}`,
    });
  }

  if (proposedPremises.length === 0 && !requirementsIncomplete(data)) {
    items.push({
      label: "No properties proposed yet",
      href: opportunityWorkspaceHref(opportunity, "proposed"),
    });
  }

  if (activities.length === 0) {
    items.push({
      label: "No communication logged",
      href: opportunityWorkspaceHref(opportunity, "timeline"),
    });
  }

  return items.slice(0, 5);
}

export const OPPORTUNITY_QUICK_LINKS = (
  opportunity: OpportunityDetailData["opportunity"],
  proposalsEnabled: boolean,
) => {
  const links: DeskPendingItem[] = [
    { label: "Overview", href: opportunityWorkspaceHref(opportunity, "overview", "edit") },
    { label: "Proposed", href: opportunityWorkspaceHref(opportunity, "proposed") },
    { label: "Activity", href: opportunityWorkspaceHref(opportunity, "timeline") },
    { label: "Documents", href: opportunityWorkspaceHref(opportunity, "documents") },
  ];
  if (!proposalsEnabled) {
    return links.filter((l) => l.label !== "Documents");
  }
  return links;
};
