"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ContactFormDrawer } from "@/components/admin/connections/ContactFormDrawer";
import { formatCoverage } from "@/lib/connectionsDisplay";
import { contactDrawerHref } from "@/lib/connectionsDrawerNav";
import { getContactLabel } from "@/lib/contactName";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import type { Contact } from "@/lib/types/entities";

type CompanyOption = { id: number; company_name: string };

export function CompanyContactsTabClient({
  companyId,
  companyName,
  contacts,
  companies,
  drawerMode = false,
}: {
  companyId: number;
  companyName: string;
  contacts: Contact[];
  companies: CompanyOption[];
  drawerMode?: boolean;
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

  const contactHref = (contactId: number) =>
    drawerMode
      ? contactDrawerHref("/admin/contacts", searchParams, contactId)
      : `/admin/contacts/${contactId}`;

  const returnTo = drawerMode
    ? `${listPath}?company=${companyId}&tab=contacts`
    : `/admin/companies/${companyId}?tab=contacts`;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={openDrawer} className={theme.primaryButton}>
          New contact
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
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
                    <Link href={contactHref(c.id)} className={connectionsGlassClasses.link}>
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
