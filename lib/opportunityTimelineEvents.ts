import type { ActivityListRow } from "@/lib/repos/activities";
import type { OpportunityProposal } from "@/lib/types/entities";

export type TimelineEventKind = "activity" | "proposal_created" | "proposal_sent";

export type UnifiedTimelineEvent = {
  id: string;
  kind: TimelineEventKind;
  date: string;
  title: string;
  detail?: string | null;
  staff?: string | null;
  activity?: ActivityListRow;
  proposalId?: number;
};

function eventDate(iso: string | null | undefined): string {
  return (iso ?? "").slice(0, 10);
}

export function buildUnifiedTimelineEvents(
  activities: ActivityListRow[],
  proposals: OpportunityProposal[],
): UnifiedTimelineEvent[] {
  const events: UnifiedTimelineEvent[] = [];

  for (const a of activities) {
    events.push({
      id: `activity-${a.id}`,
      kind: "activity",
      date: eventDate(a.activity_date),
      title: a.activity_type,
      detail: a.subject ?? a.notes,
      staff: a.owner ?? null,
      activity: a,
    });
  }

  for (const p of proposals) {
    events.push({
      id: `proposal-created-${p.id}`,
      kind: "proposal_created",
      date: eventDate(p.created_at),
      title: `Proposal v${p.version_number} created`,
      detail: p.title,
      proposalId: p.id,
    });
    if (p.sent_date) {
      events.push({
        id: `proposal-sent-${p.id}`,
        kind: "proposal_sent",
        date: eventDate(p.sent_date),
        title: `Proposal v${p.version_number} sent`,
        detail: p.title,
        proposalId: p.id,
      });
    }
  }

  return events.sort((a, b) => {
    const cmp = b.date.localeCompare(a.date);
    if (cmp !== 0) return cmp;
    return b.id.localeCompare(a.id);
  });
}
