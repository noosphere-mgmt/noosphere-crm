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
import { companyFullPageHref } from "@/lib/crmDetailNav";
import { contactDrawerHref } from "@/lib/connectionsDrawerNav";
import { MobileCardMeta, MobileCardTitle } from "@/components/admin/mobile/MobileCard";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { MobileContactActions } from "@/components/admin/mobile/MobileContactActions";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";

export function ConnectionsContactsListMobile({
  state,
  onOpenContact,
}: {
  state: ConnectionsContactsListState;
  onOpenContact: (id: number | string) => void;
}) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();
  const { rows, displayedRows, searchParams } = state;

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
            const companyHref = companyFullPageHref(row.company_business_id ?? row.company_id);
            const contactHref = contactDrawerHref(
              "/admin/contacts",
              searchParams,
              row.business_id ?? row.v1_contact_id ?? row.id,
            );
            return (
              <MobileSwipeToDeleteRow
                key={row.id}
                rowId={id}
                disabled={isDeleting}
                deleteLabel={`Delete ${label}`}
                onDelete={() => deleteContactRow(row.id, label)}
                className="border-b border-slate-100 last:border-b-0"
              >
                <div className="w-full px-3 py-3 text-left">
                  <AdminEntityLink
                    href={contactHref}
                    className={`block w-full cursor-pointer text-left active:bg-slate-50 ${connectionsGlassClasses.link}`}
                  >
                    <MobileCardTitle>{label}</MobileCardTitle>
                    <RecordBusinessId id={row.business_id ?? row.v1_contact_id} className="mt-0.5 block" />
                  </AdminEntityLink>
                  <MobileCardMeta>
                    <span className="block">
                      <AdminEntityLink
                        href={companyHref}
                        className={`${connectionsGlassClasses.link} underline-offset-2 hover:underline`}
                        fallback={row.company_name ?? "No company"}
                      >
                        {row.company_name ?? (row.company_id != null ? `#${row.company_id}` : null)}
                      </AdminEntityLink>
                      {row.company_name_zh ? (
                        <span className="mt-0.5 block text-xs text-slate-500">{row.company_name_zh}</span>
                      ) : null}
                    </span>
                    <span>{` · ${row.open_opportunities ?? 0} open opps`}</span>
                  </MobileCardMeta>
                  <button
                    type="button"
                    onClick={() => onOpenContact(row.id)}
                    className="w-full cursor-pointer text-left active:bg-slate-50"
                  >
                    <MobileCardMeta>Updated {formatDateLabel(row.updated_at)}</MobileCardMeta>
                  </button>
                  <MobileContactActions phone={row.phone} whatsapp={row.whatsapp} email={row.email} />
                </div>
              </MobileSwipeToDeleteRow>
            );
          })
        )}
      </div>
    </MobileSwipeDeleteGroup>
  );
}
