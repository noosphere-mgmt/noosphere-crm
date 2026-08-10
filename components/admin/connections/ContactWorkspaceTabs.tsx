"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CONTACT_WORKSPACE_TABS, getContactWorkspaceTab } from "@/lib/contactWorkspaceTab";
import { contactWorkspaceHref } from "@/lib/contactWorkspaceNav";
import type { Contact } from "@/lib/types/entities";

export function ContactWorkspaceTabs({
  contact,
  counts,
}: {
  contact: Contact;
  counts?: { affiliations?: number; deals?: number };
}) {
  const searchParams = useSearchParams();
  const active = getContactWorkspaceTab({ tab: searchParams.get("tab") });

  return (
    <nav className="flex gap-1 pb-1" aria-label="Contact workspace sections">
      {CONTACT_WORKSPACE_TABS.map((tab) => {
        const isActive = active === tab.id;
        const href = contactWorkspaceHref(contact, tab.id);
        const count =
          tab.id === "affiliations"
            ? counts?.affiliations ?? 0
            : tab.id === "deals"
              ? counts?.deals ?? 0
              : 0;
        return (
          <Link
            key={tab.id}
            href={href}
            className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm ${
              isActive
                ? "bg-[rgba(91,33,182,0.14)] text-violet-900"
                : "text-slate-600 hover:bg-[rgba(91,33,182,0.08)] hover:text-violet-900"
            }`}
          >
            {tab.label}
            {count > 0 ? ` ${count}` : ""}
          </Link>
        );
      })}
    </nav>
  );
}
