"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { patchProposedPremisesLineInlineAction } from "@/app/admin/opportunities/workspaceActions";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import {
  formatProposedPremisesLabel,
  formatProposedPremisesListMeta,
  proposedPremisesEffectivePrice,
  proposedPremisesEffectiveTourDate,
  proposedPremisesListingPrice,
  proposedPremisesListingRemarks,
  proposedPremisesPropertiesHref,
  proposedPremisesTourDateSource,
} from "@/lib/proposedPremisesDisplay";
import {
  PROPOSED_PREMISES_PREFERENCES,
  PROPOSED_PREMISES_PREFERENCE_LABELS,
  PROPOSED_PREMISES_STATUSES,
  PROPOSED_PREMISES_STATUS_LABELS,
} from "@/lib/opportunityValues";
import type { OpportunityProposedPremises } from "@/lib/types/entities";

const cellInput =
  "w-full min-w-0 rounded border border-slate-200 bg-white px-1.5 py-1 text-sm text-slate-800 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-100";
const cellSelect = `${cellInput} pr-6`;

export function ProposedPremisesListRow({
  row,
  opportunityId,
  selected,
  onToggleSelect,
  onEdit,
}: {
  row: OpportunityProposedPremises;
  opportunityId: number;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
}) {
  const theme = moduleAccentClasses("opportunities");
  const [pending, startTransition] = useTransition();
  const [remarks, setRemarks] = useState(() => proposedPremisesListingRemarks(row));
  const [price, setPrice] = useState(() => proposedPremisesEffectivePrice(row));
  const [tourDate, setTourDate] = useState(() => proposedPremisesEffectiveTourDate(row));
  const listingPrice = proposedPremisesListingPrice(row);
  const tourSource = proposedPremisesTourDateSource(row);
  const meta = formatProposedPremisesListMeta(row);

  useEffect(() => {
    setPrice(proposedPremisesEffectivePrice(row));
    setTourDate(proposedPremisesEffectiveTourDate(row));
    setRemarks(proposedPremisesListingRemarks(row));
  }, [
    row.id,
    row.updated_at,
    row.proposed_price,
    row.tour_date,
    row.site_tour_activity_date,
    row.monthly_rent,
    row.asking_sale_price,
    row.remarks,
    row.advisor_comment,
    row.client_comment,
  ]);

  function save(patch: Record<string, string>) {
    const fd = new FormData();
    fd.set("opportunity_id", String(opportunityId));
    for (const [key, value] of Object.entries(patch)) {
      fd.set(key, value);
    }
    startTransition(async () => {
      await patchProposedPremisesLineInlineAction(row.id, opportunityId, fd);
    });
  }

  return (
    <tr className={`border-t border-slate-100 align-top ${pending ? "opacity-60" : ""}`}>
      <td className="px-3 py-1.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label="Select row"
          className="rounded border-slate-300"
        />
      </td>
      <td className="px-3 py-1.5">
        <Link
          href={proposedPremisesPropertiesHref(row.premises_id, opportunityId)}
          className={`block font-medium ${theme.link}`}
        >
          {formatProposedPremisesLabel(row)}
        </Link>
        {meta ? <p className="mt-0.5 text-xs text-slate-500">{meta}</p> : null}
      </td>
      <td className="px-3 py-1.5 text-slate-700">{row.operator_name ?? row.owner_name ?? "—"}</td>
      <td className="px-3 py-1.5">
        <input
          type="number"
          className={cellInput}
          value={price}
          placeholder={listingPrice || "—"}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={(e) => {
            const next = e.target.value.trim();
            const stored = row.proposed_price?.trim() || listingPrice || "";
            if (next !== stored) save({ proposed_price: next });
          }}
        />
      </td>
      <td className="px-3 py-1.5">
        <input
          type="date"
          className={cellInput}
          value={tourDate}
          onChange={(e) => {
            const next = e.target.value;
            setTourDate(next);
            const stored = row.tour_date?.slice(0, 10) ?? "";
            if (next !== stored) save({ tour_date: next });
          }}
          onBlur={(e) => {
            const next = e.target.value;
            const stored = row.tour_date?.slice(0, 10) ?? "";
            if (next !== stored) save({ tour_date: next });
          }}
        />
        {tourSource === "activity" ? (
          <p className="mt-0.5 text-[10px] text-slate-500">From site tour activity</p>
        ) : null}
      </td>
      <td className="px-3 py-1.5">
        <select
          className={cellSelect}
          defaultValue={row.status}
          onChange={(e) => save({ status: e.target.value })}
        >
          {PROPOSED_PREMISES_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PROPOSED_PREMISES_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-1.5">
        <select
          className={cellSelect}
          defaultValue={row.preference ?? ""}
          onChange={(e) => save({ preference: e.target.value })}
        >
          <option value="">—</option>
          {PROPOSED_PREMISES_PREFERENCES.map((p) => (
            <option key={p} value={p}>
              {PROPOSED_PREMISES_PREFERENCE_LABELS[p]}
            </option>
          ))}
        </select>
      </td>
      <td className="max-w-[14rem] px-3 py-1.5">
        <textarea
          className={`${cellInput} min-h-[2rem] resize-y`}
          rows={1}
          value={remarks}
          placeholder="—"
          onChange={(e) => setRemarks(e.target.value)}
          onBlur={(e) => {
            const next = e.target.value.trim();
            const prev = proposedPremisesListingRemarks(row);
            if (next !== prev) save({ remarks: next });
          }}
        />
      </td>
      <td className="px-3 py-1.5">
        <ModuleRowActions module="opportunities" onEdit={onEdit} />
      </td>
    </tr>
  );
}
