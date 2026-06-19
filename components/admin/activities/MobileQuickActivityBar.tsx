"use client";

import { useState, useTransition } from "react";
import { createActivityAction } from "@/app/admin/activities/actions";
import { MOBILE_QUICK_ACTIVITY_TYPES } from "@/lib/activityValues";
import type { ActivityFormDefaults } from "@/components/admin/activities/ActivityFormDrawer";

export function MobileQuickActivityBar({
  onSelectType,
  defaults,
}: {
  onSelectType: (type: string) => void;
  defaults?: ActivityFormDefaults;
}) {
  const [quickType, setQuickType] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function quickSave(type: string) {
    const fd = new FormData();
    fd.set("activity_date", new Date().toISOString().slice(0, 10));
    fd.set("activity_type", type);
    fd.set("notes", notes);
    if (defaults?.company_id) fd.set("company_id", String(defaults.company_id));
    if (defaults?.contact_id) fd.set("contact_id", String(defaults.contact_id));
    if (defaults?.opportunity_id) fd.set("opportunity_id", String(defaults.opportunity_id));
    if (defaults?.premises_id) fd.set("premises_id", defaults.premises_id);

    startTransition(async () => {
      const result = await createActivityAction(fd);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      setQuickType(null);
      setNotes("");
    });
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
      <p className="mb-2 text-xs font-medium text-amber-900">Quick log</p>
      <div className="flex flex-wrap gap-1.5">
        {MOBILE_QUICK_ACTIVITY_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setQuickType(type);
              onSelectType(type);
            }}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              quickType === type
                ? "bg-amber-700 text-white"
                : "bg-white text-amber-900 ring-1 ring-amber-200"
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      {quickType ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Notes (optional)"
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => quickSave(quickType)}
            className="rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "Saving…" : `Save ${quickType}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
