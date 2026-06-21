"use client";

import type { ConnectionsContactsListState } from "@/components/admin/connections/useConnectionsContactsList";
import { formatDateLabel } from "@/lib/connectionsDisplay";
import { getContactLabel } from "@/lib/contactName";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import { MobileCardMeta, MobileCardTitle } from "@/components/admin/mobile/MobileCard";
import { MobileContactActions } from "@/components/admin/mobile/MobileContactActions";

export function ConnectionsContactsListMobile({
  state,
  onOpenContact,
}: {
  state: ConnectionsContactsListState;
  onOpenContact: (id: number) => void;
}) {
  const { rows, displayedRows, selected, toggleOne, toggleAll, allDisplayedSelected, displayedIds } = state;

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {displayedRows.length > 0 ? (
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
          <input
            type="checkbox"
            checked={allDisplayedSelected}
            onChange={(e) => toggleAll(displayedIds, e.target.checked)}
            aria-label="Select all contacts"
            className="rounded border-slate-300"
          />
          <span className="text-xs text-slate-500">Select all</span>
        </div>
      ) : null}

      {displayedRows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-500">
          {rows.length === 0 ? "No contacts yet." : "No contacts match your search."}
        </p>
      ) : (
        displayedRows.map((row) => {
          const id = String(row.id);
          return (
            <div
              key={row.id}
              className="flex items-start gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0"
            >
              <input
                type="checkbox"
                checked={selected.has(id)}
                onChange={() => toggleOne(id)}
                aria-label={`Select ${getContactLabel(row)}`}
                className="mt-1 rounded border-slate-300"
              />
              <button
                type="button"
                onClick={() => onOpenContact(row.id)}
                className={`min-w-0 flex-1 text-left ${connectionsGlassClasses.link}`}
              >
                <MobileCardTitle>{getContactLabel(row)}</MobileCardTitle>
                <MobileCardMeta>
                  {row.company_name ?? "No company"} · {row.open_opportunities ?? 0} open opps
                </MobileCardMeta>
                <MobileCardMeta>Updated {formatDateLabel(row.updated_at)}</MobileCardMeta>
                <MobileContactActions phone={row.phone} whatsapp={row.whatsapp} email={row.email} />
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
