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
      <div className="space-y-2">
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
                className="rounded-xl border border-l-4 border-[#DED8E2] border-l-[#9A8EA3] bg-white shadow-[0_4px_14px_rgba(112,98,119,0.11)]"
              >
                <div className="w-full bg-white px-3 py-3 text-left">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <AdminEntityLink
                      href={contactHref}
                      className="min-w-0 flex-1 cursor-pointer text-left active:bg-white/50"
                    >
                      <p className="break-words font-semibold text-[#66566D]">{label}</p>
                    </AdminEntityLink>
                    <span className="shrink-0 rounded-full bg-[#E9E2EC] px-2 py-1 text-[11px] font-semibold text-[#66566D]">
                      {row.open_opportunities ?? 0} open
                    </span>
                  </div>
                  <div className="mt-1 flex min-w-0 items-end justify-between gap-3">
                    <div className="min-w-0 text-xs text-slate-600">
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
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenContact(row.id)}
                      className="shrink-0 cursor-pointer text-xs tabular-nums text-slate-500 active:text-[#66566D]"
                    >
                      {formatDateLabel(row.updated_at)}
                    </button>
                  </div>
                </div>
              </MobileSwipeToDeleteRow>
            );
          })
        )}
      </div>
    </MobileSwipeDeleteGroup>
  );
}
