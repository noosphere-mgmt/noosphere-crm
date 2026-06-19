"use client";

import { useEffect, useState, useTransition } from "react";
import { createActivityAction, getActivityPremisesIdsAction, updateActivityAction } from "@/app/admin/activities/actions";
import { ActivityLinkTypeahead } from "@/components/admin/activities/ActivityLinkTypeahead";
import { ActivityPremisesMultiPicker } from "@/components/admin/activities/ActivityPremisesMultiPicker";
import { IconX } from "@/components/admin/ModuleActionIcons";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { ACTIVITY_FORM_TYPES, isActivityFormType, isSiteTourActivityType, type SiteTourCheckpointMode } from "@/lib/activityValues";
import type { ActivityLinkSearchHit, ActivityListRow } from "@/lib/repos/activities";

export type ActivityFormDefaults = {
  activity_date?: string;
  activity_time?: string | null;
  activity_type?: string;
  notes?: string | null;
  company_id?: number | null;
  company_name?: string | null;
  contact_id?: number | null;
  contact_name?: string | null;
  opportunity_id?: number | null;
  opportunity_name?: string | null;
  premises_id?: string | null;
  premises_label?: string | null;
};

const fieldClass =
  "w-full rounded-lg border border-amber-200/80 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100";
const labelClass = "mb-1 block text-xs font-medium text-slate-600";

function hitFromDefaults(
  entityType: ActivityLinkSearchHit["entity_type"],
  id: string | number | null | undefined,
  label: string | null | undefined,
): ActivityLinkSearchHit | null {
  if (id == null || !label) return null;
  return { entity_type: entityType, entity_id: String(id), label, subtitle: null };
}

export function ActivityFormDrawer({
  open,
  onClose,
  activity,
  defaults,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  activity?: ActivityListRow | null;
  defaults?: ActivityFormDefaults;
  onSaved?: () => void;
}) {
  const theme = moduleAccentClasses("activities");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const [activityDate, setActivityDate] = useState(today);
  const [activityTime, setActivityTime] = useState("");
  const [activityType, setActivityType] = useState("Call");
  const [notes, setNotes] = useState("");
  const [company, setCompany] = useState<ActivityLinkSearchHit | null>(null);
  const [contact, setContact] = useState<ActivityLinkSearchHit | null>(null);
  const [opportunity, setOpportunity] = useState<ActivityLinkSearchHit | null>(null);
  const [premises, setPremises] = useState<ActivityLinkSearchHit | null>(null);
  const [checkpointMode, setCheckpointMode] = useState<SiteTourCheckpointMode>("split");
  const [premisesCheckpoints, setPremisesCheckpoints] = useState<ActivityLinkSearchHit[]>([]);

  useEffect(() => {
    if (!open) return;
    const d = activity ?? defaults;
    setActivityDate(d?.activity_date?.slice(0, 10) ?? today);
    setActivityTime(d?.activity_time ?? "");
    setActivityType(d?.activity_type ?? defaults?.activity_type ?? "Call");
    setNotes(d?.notes ?? "");
    setCompany(
      hitFromDefaults("company", activity?.company_id ?? defaults?.company_id, activity?.company_name ?? defaults?.company_name),
    );
    setContact(
      hitFromDefaults("contact", activity?.contact_id ?? defaults?.contact_id, activity?.contact_name ?? defaults?.contact_name),
    );
    setOpportunity(
      hitFromDefaults(
        "opportunity",
        activity?.opportunity_id ?? defaults?.opportunity_id,
        activity?.opportunity_name ?? defaults?.opportunity_name,
      ),
    );
    const primaryPremises = hitFromDefaults(
      "premises",
      activity?.premises_id ?? defaults?.premises_id,
      activity?.premises_label ?? defaults?.premises_label,
    );
    setPremises(primaryPremises);
    setCheckpointMode("split");
    setPremisesCheckpoints(primaryPremises ? [primaryPremises] : []);
    setError(null);

    if (activity?.activity_id) {
      void getActivityPremisesIdsAction(activity.activity_id).then((ids) => {
        const allIds = [
          ...new Set([activity.premises_id, ...ids].filter((id): id is string => Boolean(id?.trim()))),
        ];
        if (allIds.length <= 1) return;
        const labels = (activity.premises_label ?? "").split(",").map((s) => s.trim());
        setPremisesCheckpoints(
          allIds.map((id, index) => ({
            entity_type: "premises" as const,
            entity_id: id,
            label: labels[index] ?? labels[0] ?? id,
            subtitle: null,
          })),
        );
        setCheckpointMode("combined");
      });
    }
  }, [open, activity, defaults, today]);

  const isSiteTour = isSiteTourActivityType(activityType);
  const useMultiPremises = isSiteTour && !activity;

  if (!open) return null;

  function submit() {
    const fd = new FormData();
    fd.set("activity_date", activityDate);
    fd.set("activity_time", activityTime);
    fd.set("activity_type", activityType);
    fd.set("notes", notes);
    if (company) fd.set("company_id", company.entity_id);
    if (contact) fd.set("contact_id", contact.entity_id);
    if (opportunity) fd.set("opportunity_id", opportunity.entity_id);

    if (useMultiPremises && premisesCheckpoints.length > 0) {
      fd.set("premises_ids", premisesCheckpoints.map((p) => p.entity_id).join(","));
      fd.set("checkpoint_mode", checkpointMode);
      if (checkpointMode === "combined" && premisesCheckpoints[0]) {
        fd.set("premises_id", premisesCheckpoints[0].entity_id);
      }
    } else if (activity && premisesCheckpoints.length > 1) {
      fd.set("premises_ids", premisesCheckpoints.map((p) => p.entity_id).join(","));
      if (premisesCheckpoints[0]) fd.set("premises_id", premisesCheckpoints[0].entity_id);
    } else if (premises) {
      fd.set("premises_id", premises.entity_id);
    }

    startTransition(async () => {
      const result = activity
        ? await updateActivityAction(activity.activity_id, fd)
        : await createActivityAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved?.();
      onClose();
    });
  }

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-slate-900/10" aria-label="Close" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-amber-100 bg-amber-50/30 shadow-xl lg:w-[min(640px,44vw)]">
        <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-amber-100 bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-amber-800/80">Activities</p>
            <h2 className="text-base font-semibold text-slate-900">
              {activity ? "Edit activity" : "New activity"}
            </h2>
            {activityType ? <p className="mt-0.5 text-sm text-slate-600">{activityType}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button type="button" disabled={pending} onClick={submit} className={theme.primaryButton}>
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <IconX />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className={labelClass}>Activity date</span>
              <input
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm">
              <span className={labelClass}>Activity time</span>
              <input
                type="time"
                value={activityTime}
                onChange={(e) => setActivityTime(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm">
              <span className={labelClass}>Type</span>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className={fieldClass}
              >
                {ACTIVITY_FORM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                {!isActivityFormType(activityType) ? (
                  <option value={activityType}>{activityType}</option>
                ) : null}
              </select>
            </label>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ActivityLinkTypeahead label="Linked company" entityType="company" value={company} onChange={setCompany} disabled={pending} />
            <ActivityLinkTypeahead label="Linked contact" entityType="contact" value={contact} onChange={setContact} disabled={pending} />
          </section>

          <section>
            <ActivityLinkTypeahead
              label="Linked opportunity"
              entityType="opportunity"
              value={opportunity}
              onChange={setOpportunity}
              disabled={pending}
            />
          </section>

          {isSiteTour && !activity ? (
            <section className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
              <p className="mb-2 text-xs font-medium text-amber-950">Site tour checkpoints</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setCheckpointMode("split")}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    checkpointMode === "split"
                      ? "bg-amber-800 text-white"
                      : "bg-white text-amber-900 ring-1 ring-amber-200"
                  }`}
                >
                  One activity per premises
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setCheckpointMode("combined")}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    checkpointMode === "combined"
                      ? "bg-amber-800 text-white"
                      : "bg-white text-amber-900 ring-1 ring-amber-200"
                  }`}
                >
                  Multiple premises on one activity
                </button>
              </div>
            </section>
          ) : null}

          <section>
            {useMultiPremises || (activity && isSiteTour) ? (
              <ActivityPremisesMultiPicker value={premisesCheckpoints} onChange={setPremisesCheckpoints} disabled={pending} />
            ) : (
              <ActivityLinkTypeahead label="Linked premises" entityType="premises" value={premises} onChange={setPremises} disabled={pending} />
            )}
          </section>

          <section>
            <label className="block text-sm">
              <span className={labelClass}>Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`${fieldClass} min-h-[120px] resize-y`}
                placeholder="What happened, next steps, tour feedback…"
              />
            </label>
          </section>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>
      </aside>
    </>
  );
}
