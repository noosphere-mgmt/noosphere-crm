"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ConnectionsContactsListState } from "@/components/admin/connections/useConnectionsContactsList";
import { confirmDeleteContact } from "@/components/admin/mobile/mobileListDelete";
import {
  MobileSwipeDeleteGroup,
  MobileSwipeToDeleteRow,
} from "@/components/admin/mobile/MobileSwipeToDeleteRow";
import { formatDateLabel } from "@/lib/connectionsDisplay";
import { getContactLabel } from "@/lib/contactName";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import { MobileCardMeta, MobileCardTitle } from "@/components/admin/mobile/MobileCard";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { MobileContactActions } from "@/components/admin/mobile/MobileContactActions";

export function ConnectionsContactsListMobile({
  state,
  onOpenContact,
}: {
  state: ConnectionsContactsListState;
  onOpenContact: (id: number | string) => void;
}) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();
  const { rows, displayedRows } = state;

  function deleteContactRow(id: number, label: string) {
    startDelete(async () => {
      const deleted = await confirmDeleteContact(label, id);
      if (deleted) router.refresh();
    });
  }

  return (
    <MobileSwipeDeleteGroup>
      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {displayedRows.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            {rows.length === 0 ? "No contacts yet." : "No contacts match your search."}
          </p>
        ) : (
          displayedRows.map((row) => {
            const id = String(row.id);
            const label = getContactLabel(row);
            return (
              <MobileSwipeToDeleteRow
                key={row.id}
                rowId={id}
                disabled={isDeleting}
                deleteLabel={`Delete ${label}`}
                onDelete={() => deleteContactRow(row.id, label)}
                className="border-b border-slate-100 last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => onOpenContact(row.id)}
                  className={`w-full cursor-pointer px-3 py-3 text-left active:bg-slate-50 ${connectionsGlassClasses.link}`}
                >
                  <MobileCardTitle>{label}</MobileCardTitle>
                  <RecordBusinessId id={row.business_id ?? row.v1_contact_id} className="mt-0.5 block" />
                  <MobileCardMeta>
                    {row.company_name ?? "No company"} · {row.open_opportunities ?? 0} open opps
                  </MobileCardMeta>
                  <MobileCardMeta>Updated {formatDateLabel(row.updated_at)}</MobileCardMeta>
                  <MobileContactActions phone={row.phone} whatsapp={row.whatsapp} email={row.email} />
                </button>
              </MobileSwipeToDeleteRow>
            );
          })
        )}
      </div>
    </MobileSwipeDeleteGroup>
  );
}
