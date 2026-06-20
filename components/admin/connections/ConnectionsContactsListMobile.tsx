"use client";

import type { ConnectionsContactsListState } from "@/components/admin/connections/useConnectionsContactsList";
import { formatDateLabel } from "@/lib/connectionsDisplay";
import { getContactLabel } from "@/lib/contactName";
import { MobileCard, MobileCardList, MobileCardMeta, MobileCardTitle } from "@/components/admin/mobile/MobileCard";
import { MobileContactActions } from "@/components/admin/mobile/MobileContactActions";

export function ConnectionsContactsListMobile({
  state,
  onOpenContact,
}: {
  state: ConnectionsContactsListState;
  onOpenContact: (id: number) => void;
}) {
  const { rows, displayedRows } = state;

  return (
    <MobileCardList>
      {displayedRows.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-slate-500">
          {rows.length === 0 ? "No contacts yet." : "No contacts match your search."}
        </p>
      ) : (
        displayedRows.map((row) => (
          <MobileCard key={row.id} onClick={() => onOpenContact(row.id)}>
            <MobileCardTitle>{getContactLabel(row)}</MobileCardTitle>
            <MobileCardMeta>
              {row.company_name ?? "No company"} · {row.open_opportunities ?? 0} open opps
            </MobileCardMeta>
            <MobileCardMeta>Updated {formatDateLabel(row.updated_at)}</MobileCardMeta>
            <MobileContactActions phone={row.phone} whatsapp={row.whatsapp} email={row.email} />
          </MobileCard>
        ))
      )}
    </MobileCardList>
  );
}
