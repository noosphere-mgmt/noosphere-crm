"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ConnectionsContactsListState } from "@/components/admin/connections/useConnectionsContactsList";
import { ContactCoverageBadges } from "@/components/admin/connections/ContactCoverageBadges";
import { confirmDeleteContact } from "@/components/admin/mobile/mobileListDelete";
import {
  MobileSwipeDeleteGroup,
  MobileSwipeToDeleteRow,
} from "@/components/admin/mobile/MobileSwipeToDeleteRow";
import { getContactLabel } from "@/lib/contactName";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import { companyFullPageHref } from "@/lib/crmDetailNav";
import { contactDrawerHref } from "@/lib/connectionsDrawerNav";
import { formatPhoneDisplay } from "@/lib/phoneAreaCodes";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";

export function ConnectionsContactsListMobile({
  state,
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
            const phone = formatPhoneDisplay(row.phone_area_code, row.phone);
            const secondary = [row.email?.trim() || null, phone].filter(Boolean).join(" · ");
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
                  <AdminEntityLink
                    href={contactHref}
                    className="block min-w-0 cursor-pointer text-left active:bg-white/50"
                  >
                    <p className="break-words font-semibold text-[#66566D]">{label}</p>
                  </AdminEntityLink>
                  <div className="mt-1 min-w-0 text-xs text-slate-600">
                    <AdminEntityLink
                      href={companyHref}
                      className={`${connectionsGlassClasses.link} underline-offset-2 hover:underline`}
                      fallback={row.company_name ?? "No company"}
                    >
                      {row.company_name ?? (row.company_id != null ? `#${row.company_id}` : null)}
                    </AdminEntityLink>
                    {row.company_name_zh ? (
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{row.company_name_zh}</span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-700" title={row.title?.trim() || undefined}>
                    {row.title?.trim() || "—"}
                  </p>
                  <div className="mt-1">
                    <ContactCoverageBadges values={row.coverage} />
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">{secondary || "—"}</p>
                </div>
              </MobileSwipeToDeleteRow>
            );
          })
        )}
      </div>
    </MobileSwipeDeleteGroup>
  );
}
