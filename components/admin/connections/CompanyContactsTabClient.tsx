"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ContactFormDrawer } from "@/components/admin/connections/ContactFormDrawer";
import { formatCoverage } from "@/lib/connectionsDisplay";
import { contactDrawerHref } from "@/lib/connectionsDrawerNav";
import { companyWorkspaceHref } from "@/lib/companyWorkspaceNav";
import { contactWorkspaceHref } from "@/lib/contactWorkspaceNav";
import { getContactLabel } from "@/lib/contactName";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import type { Contact } from "@/lib/types/entities";

type CompanyOption = { id: number; company_name: string };

export function CompanyContactsTabClient({
  companyId,
  companyName,
  companyBusinessId,
  contacts,
  companies,
  drawerMode = false,
  listReturnTo,
}: {
  companyId: number;
  companyName: string;
  companyBusinessId?: string | null;
  contacts: Contact[];
  companies: CompanyOption[];
  drawerMode?: boolean;
  /** When on company full page, preserve outer listing return path. */
  listReturnTo?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const drawerOpen = searchParams.get("add_contact") === "1";
  const theme = moduleAccentClasses("connections");
  const listPath = drawerMode ? "/admin/companies" : `/admin/companies/${companyId}`;

  const openDrawer = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (drawerMode) params.set("company", String(companyId));
    params.set("tab", "contacts");
    params.set("add_contact", "1");
    router.push(`${listPath}?${params.toString()}`);
  }, [companyId, drawerMode, listPath, router, searchParams]);

  const closeDrawer = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("add_contact");
    if (drawerMode) {
      params.set("company", String(companyId));
      params.set("tab", "contacts");
    }
    router.push(`${listPath}?${params.toString()}`);
  }, [companyId, drawerMode, listPath, router, searchParams]);

  const companyRef = companyBusinessId?.trim() || String(companyId);
  const companyContactsReturnTo = drawerMode
    ? `${listPath}?company=${encodeURIComponent(companyRef)}&tab=contacts`
    : companyWorkspaceHref(
        { id: companyId, business_id: companyBusinessId },
        "contacts",
        undefined,
        listReturnTo,
      );

  const contactHref = (contact: Contact) =>
    drawerMode
      ? contactDrawerHref("/admin/companies", searchParams, contact.business_id ?? contact.id)
      : contactWorkspaceHref(contact, "overview", undefined, companyContactsReturnTo);

  const returnTo = companyContactsReturnTo

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={openDrawer} className={theme.primaryButton}>
          New contact
        </button>
      </div>

      <div className="space-y-2 md:hidden">
        {contacts.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">No contacts yet.</p>
        ) : contacts.map((c) => (
          <Link key={`mobile-${c.id}`} href={contactHref(c)} className="block rounded-xl border border-l-4 border-[#DED8E2] border-l-[#9A8EA3] bg-[#F7F4F7] p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-[#66566D]">{getContactLabel(c)}</p>
                <p className="mt-0.5 text-xs text-slate-600">{[c.title, formatCoverage(c.coverage)].filter((value) => value && value !== "—").join(" · ") || "Contact"}</p>
              </div>
              {c.is_primary ? <span className="shrink-0 rounded-full bg-[#E9E2EC] px-2 py-1 text-[11px] font-semibold text-[#66566D]">Primary</span> : null}
            </div>
            <p className="mt-2 truncate text-xs text-slate-500">{c.email ?? "No email"}{c.last_activity_date ? ` · ${c.last_activity_date.slice(0, 10)}` : ""}</p>
          </Link>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Coverage</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Last Activity</th>
              <th className="px-4 py-2 font-medium">Primary</th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No contacts yet.
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">
                    <Link href={contactHref(c)} className={connectionsGlassClasses.link}>
                      {getContactLabel(c)}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-700">{c.title ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-700">{formatCoverage(c.coverage)}</td>
                  <td className="px-4 py-2 text-slate-700">{c.email ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-700">{c.last_activity_date?.slice(0, 10) ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-700">{c.is_primary ? "Yes" : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ContactFormDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        companies={companies.length > 0 ? companies : [{ id: companyId, company_name: companyName }]}
        fixedCompanyId={companyId}
        returnTo={returnTo}
      />
    </div>
  );
}
