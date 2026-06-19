"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  addContactRelationshipAction,
  removeContactRelationshipAction,
} from "@/app/admin/contacts/actions";
import { DrawerOverviewCard } from "@/components/admin/connections/DrawerOverviewCard";
import {
  CONTACT_RELATIONSHIP_TYPES,
  contactRelationshipTypeLabel,
  type ContactRelationship,
} from "@/lib/contactRelationships";
import { companyDrawerHref } from "@/lib/connectionsDrawerNav";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";

type CompanyOption = { id: number; company_name: string };

export function ContactRelationshipsCard({
  contactId,
  relationships,
  companies,
}: {
  contactId: number;
  relationships: ContactRelationship[];
  companies: CompanyOption[];
}) {
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [relationshipType, setRelationshipType] = useState<string>("agent");
  const [companyId, setCompanyId] = useState<number | "">("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = companies.filter((c) =>
    c.company_name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function handleAdd() {
    if (companyId === "") {
      setError("Select a company");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addContactRelationshipAction(contactId, companyId, relationshipType);
      if (!result.ok) {
        setError(result.error ?? "Could not add relationship");
        return;
      }
      setCompanyId("");
      setQuery("");
    });
  }

  function handleRemove(id: number) {
    startTransition(async () => {
      await removeContactRelationshipAction(id, contactId);
    });
  }

  return (
    <DrawerOverviewCard title="Relationships" dense={false} bare>
      <div className="space-y-3">
        {relationships.length === 0 ? (
          <p className="text-sm text-slate-500">No agents or referring entities linked yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
            {relationships.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    <Link
                      href={companyDrawerHref(
                        "/admin/companies",
                        searchParams,
                        row.related_company_id,
                        "overview",
                      )}
                      className={connectionsGlassClasses.link}
                    >
                      {row.related_company_name ?? `Company #${row.related_company_id}`}
                    </Link>
                  </p>
                  <p className="text-xs text-slate-500">
                    {contactRelationshipTypeLabel(row.relationship_type)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleRemove(row.id)}
                  className="shrink-0 text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Add relationship
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">Type</span>
              <select
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              >
                {CONTACT_RELATIONSHIP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm sm:col-span-1">
              <span className="mb-1 block text-xs font-medium text-slate-600">Company</span>
              <input
                type="search"
                value={query}
                placeholder="Search companies…"
                onChange={(e) => setQuery(e.target.value)}
                className="mb-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              />
              <select
                value={companyId === "" ? "" : String(companyId)}
                onChange={(e) => {
                  const v = e.target.value;
                  setCompanyId(v ? Number.parseInt(v, 10) : "");
                }}
                className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">Select company…</option>
                {filtered.slice(0, 40).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
          <button
            type="button"
            disabled={pending}
            onClick={handleAdd}
            className="mt-2 rounded-md bg-violet-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-950 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Add relationship"}
          </button>
        </div>
      </div>
    </DrawerOverviewCard>
  );
}
