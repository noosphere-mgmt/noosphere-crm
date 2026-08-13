import type { ActivityListRow } from "@/lib/repos/activities";
import type { PremisesProposedOpportunityRow } from "@/lib/repos/opportunityProposedPremises";

export type PremisesTimelineEventKind = "activity" | "shortlisted" | "shortlist_status";

export type PremisesTimelineEvent = {
  id: string;
  kind: PremisesTimelineEventKind;
  date: string;
  title: string;
  detail?: string | null;
  opportunityId?: number;
  activity?: ActivityListRow;
};

function eventDate(iso: string | null | undefined): string {
  return (iso ?? "").slice(0, 10);
}

export function buildPremisesTimelineEvents(
  activities: ActivityListRow[],
  proposed: PremisesProposedOpportunityRow[],
): PremisesTimelineEvent[] {
  const events: PremisesTimelineEvent[] = [];

  for (const a of activities) {
    events.push({
      id: `activity-${a.id}`,
      kind: "activity",
      date: eventDate(a.activity_date),
      title: a.activity_type,
      detail: a.subject ?? a.notes,
      activity: a,
    });
  }

  for (const row of proposed) {
    events.push({
      id: `shortlist-${row.id}`,
      kind: "shortlisted",
      date: eventDate(row.created_at ?? row.proposed_date),
      title: "Added to deal shortlist",
      detail: row.opportunity_client_name ?? `Opportunity #${row.opportunity_id}`,
      opportunityId: row.opportunity_id,
    });
    if (row.status && row.status !== "proposed") {
      events.push({
        id: `shortlist-status-${row.id}-${row.status}`,
        kind: "shortlist_status",
        date: eventDate(row.updated_at ?? row.created_at ?? row.proposed_date),
        title: `Shortlist status: ${row.status}`,
        detail: row.opportunity_client_name ?? undefined,
        opportunityId: row.opportunity_id,
      });
    }
  }

  return events.sort((a, b) => {
    const cmp = b.date.localeCompare(a.date);
    if (cmp !== 0) return cmp;
    return b.id.localeCompare(a.id);
  });
}
