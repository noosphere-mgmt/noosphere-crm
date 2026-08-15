"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { ContactDetailBody } from "@/components/admin/connections/ContactDetailBody";
import { ContactDetailTabs } from "@/components/admin/connections/ContactDetailTabs";
import {
  ConnectionsDrawerHeader,
} from "@/components/admin/connections/ConnectionsDrawerHeader";
import { InlineEditProvider } from "@/components/admin/inline/InlineEditProvider";
import { getContactLabel } from "@/lib/contactName";
import type { ContactDrawerData } from "@/lib/repos/connectionsDrawer";

const overlayClass = "fixed inset-0 z-40 bg-slate-900/10 transition-opacity";
const panelClass =
  "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 max-md:bottom-[calc(3.5rem+env(safe-area-inset-bottom))] max-md:bg-white md:bg-slate-50 shadow-xl lg:w-[42vw] lg:max-w-[45vw]";

export function ContactDrawer({
  data,
  onClose,
}: {
  data: ContactDrawerData | null;
  onClose: () => void;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  if (!data) return null;

  const { contact } = data;
  const returnParams = new URLSearchParams(searchParams.toString());
  returnParams.delete("contact");
  returnParams.delete("tab");
  returnParams.delete("mode");
  const returnQuery = returnParams.toString();
  const returnTo = returnQuery ? `${pathname}?${returnQuery}` : pathname;

  return (
    <>
      <button type="button" className={overlayClass} aria-label="Close contact panel" onClick={onClose} />
      <aside
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-label={`Contact: ${getContactLabel(contact)}`}
      >
        <InlineEditProvider resetKey={contact.id}>
          <ConnectionsDrawerHeader
            title={getContactLabel(contact)}
            subtitle={contact.company_name ?? undefined}
            businessId={contact.business_id}
            returnTo={returnTo}
            onClose={onClose}
          />
          <div className="shrink-0 bg-white px-4 pt-2">
            <ContactDetailTabs embedded contactId={contact.id} />
          </div>
          <div className="relative z-0 flex-1 overflow-y-auto px-4 py-3">
            <ContactDetailBody data={data} tab={searchParams.get("tab")} />
          </div>
        </InlineEditProvider>
      </aside>
    </>
  );
}
