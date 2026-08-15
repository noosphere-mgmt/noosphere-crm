import { formatActivityNotesPreview } from "@/lib/activitiesDisplay";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/opportunityStatusModel";
import { buildUnifiedTimelineEvents } from "@/lib/opportunityTimelineEvents";
import { deriveNextAction } from "@/lib/opportunityWorkspaceDesk";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import { isOtherSalesRole } from "@/lib/opportunityValues";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

export type ProcessInsight = {
  id: string;
  text: string;
  tone: "neutral" | "attention" | "positive";
};

export type RecentCorrespondence = {
  id: string;
  title: string;
  date: string;
  preview: string | null;
  href: string;
};

function formatDate(value: string): string {
  if (!value) return "an unknown date";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysBetween(isoDate: string | null | undefined, from = Date.now()): number | null {
  if (!isoDate) return null;
  const parsed = new Date(`${isoDate.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor((from - parsed.getTime()) / 86_400_000);
}

/** CRM-assisted insights from pipeline progress and correspondence — not a SWOT matrix. */
export function buildOpportunityProcessInsights(
  data: OpportunityDetailData,
  proposalsEnabled = false,
): {
  headline: string;
  facts: string[];
  insights: ProcessInsight[];
  nextStep: { label: string; href: string; detail?: string };
  recent: RecentCorrespondence[];
} {
  const { opportunity, activities, proposals, proposedPremises, parties } = data;
  const events = buildUnifiedTimelineEvents(activities, proposals);
  const latest = events[0];
  const sentProposals = proposals.filter((proposal) => proposal.sent_date).length;
  const selectedPremises = proposedPremises.filter((premises) =>
    ["shortlisted", "viewing", "negotiation", "selected", "won"].includes(premises.status),
  ).length;
  const nextStep = deriveNextAction(data, proposalsEnabled);
  const insights: ProcessInsight[] = [];

  const ageDays = daysBetween(latest?.date ?? data.lastActivityDate);
  if (!latest) {
    insights.push({
      id: "no-footprint",
      text: "No activity yet.",
      tone: "attention",
    });
  } else if (ageDays != null && ageDays > 21) {
    insights.push({
      id: "stale",
      text: `Last footprint was ${ageDays} days ago (${latest.title}). A follow-up is overdue to keep the process moving.`,
      tone: "attention",
    });
  } else if (ageDays != null && ageDays <= 7) {
    insights.push({
      id: "fresh",
      text: `Recent movement: ${latest.title} on ${formatDate(latest.date)}.`,
      tone: "positive",
    });
  } else if (latest) {
    insights.push({
      id: "latest",
      text: `Latest footprint: ${latest.title} on ${formatDate(latest.date)}.`,
      tone: "neutral",
    });
  }

  if (opportunity.next_action?.trim()) {
    const due = opportunity.next_action_date?.slice(0, 10);
    const dueDays = daysBetween(due);
    if (due && dueDays != null && dueDays > 0) {
      insights.push({
        id: "next-overdue",
        text: `Next action “${opportunity.next_action.trim()}” was due ${formatDate(due)}.`,
        tone: "attention",
      });
    } else {
      insights.push({
        id: "next-set",
        text: `Tracked next action: ${opportunity.next_action.trim()}${due ? ` · ${formatDate(due)}` : ""}.`,
        tone: "neutral",
      });
    }
  } else if (opportunity.waiting_for?.trim()) {
    insights.push({
      id: "waiting",
      text: `Waiting on: ${opportunity.waiting_for.trim()}.`,
      tone: "neutral",
    });
  }

  if (proposedPremises.length === 0 && !isOtherSalesRole(opportunity.sales_role)) {
    insights.push({
      id: "no-options",
      text: "No properties proposed yet — process is still at requirement / matching.",
      tone: "attention",
    });
  } else if (selectedPremises > 0) {
    insights.push({
      id: "progressing",
      text: `${selectedPremises} of ${proposedPremises.length} option${proposedPremises.length === 1 ? "" : "s"} progressing (shortlist / viewing / negotiation).`,
      tone: "positive",
    });
  } else if (proposedPremises.length > 0) {
    insights.push({
      id: "proposed-idle",
      text: `${proposedPremises.length} option${proposedPremises.length === 1 ? "" : "s"} proposed — none marked as progressing yet.`,
      tone: "neutral",
    });
  }

  if (sentProposals > 0) {
    const lastSent = proposals
      .filter((p) => p.sent_date)
      .sort((a, b) => (b.sent_date ?? "").localeCompare(a.sent_date ?? ""))[0];
    insights.push({
      id: "proposal-sent",
      text: `${sentProposals} proposal${sentProposals === 1 ? "" : "s"} sent${lastSent?.sent_date ? ` · latest ${formatDate(lastSent.sent_date)}` : ""}. Watch for client response in Timeline.`,
      tone: "positive",
    });
  } else if (proposals.some((p) => p.status === "draft")) {
    insights.push({
      id: "proposal-draft",
      text: "A draft proposal is ready — sending it is the clearest next process step.",
      tone: "attention",
    });
  }

  const facts: string[] = [];
  if (proposedPremises.length > 0) facts.push(`${proposedPremises.length} proposed`);
  if (selectedPremises > 0) facts.push(`${selectedPremises} progressing`);
  if (sentProposals > 0) facts.push(`${sentProposals} sent`);
  if (parties.length > 0) facts.push(`${parties.length} ${parties.length === 1 ? "party" : "parties"}`);
  if (activities.length > 0) facts.push(`${activities.length} activities`);

  const timelineHref = opportunityWorkspaceHref(opportunity, "timeline");
  const recent: RecentCorrespondence[] = activities.slice(0, 3).map((activity) => {
    const notesPreview = formatActivityNotesPreview(activity.notes);
    return {
      id: String(activity.id),
      title: activity.activity_type,
      date: formatDate(activity.activity_date),
      preview: activity.subject?.trim() || (notesPreview !== "—" ? notesPreview : null),
      href: timelineHref,
    };
  });

  const headline = latest
    ? `${OPPORTUNITY_STATUS_LABELS[opportunity.status]}. Latest: ${latest.title} · ${formatDate(latest.date)}.`
    : OPPORTUNITY_STATUS_LABELS[opportunity.status];

  return {
    headline,
    facts,
    insights: insights.slice(0, 4),
    nextStep: { label: nextStep.label, href: nextStep.href, detail: nextStep.detail },
    recent,
  };
}
