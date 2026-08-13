"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LeadForm } from "@/components/admin/leads/LeadForm";
import { createLeadAction, convertLeadAction, updateLeadAction } from "@/app/admin/leads/actions";
import { SortableTableHeader, type SortDir } from "@/components/admin/SortableTableHeader";
import {
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  normalizeLeadSource,
  type LeadStatusValue,
} from "@/lib/leadValues";
import { OPPORTUNITY_CATEGORY_OPTIONS } from "@/lib/opportunityPreferences";
import {
  formatRequirementPrimaryTypes,
  formatRequirementSubtypes,
  REQUIREMENT_SUBTYPE_OPTIONS,
  type RequirementPrimaryType,
} from "@/lib/opportunityRequirementTypes";
import type { Lead, LeadStatus } from "@/lib/repos/leads";
import type { CompanyOption } from "@/lib/repos/companies";
import type { ContactOption } from "@/lib/repos/contacts";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import {
  companyFullPageHref,
  contactFullPageHref,
  leadFullPageHref,
  opportunityFullPageHref,
} from "@/lib/crmDetailNav";

const fieldClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

type SortKey =
  | "company"
  | "contact"
  | "source"
  | "status"
  | "required_type"
  | "required_subtype"
  | "location"
  | "owner"
  | "updated";

function StatusBadge({ status }: { status: LeadStatus }) {
  const color =
    status === "qualified"
      ? "bg-emerald-50 text-emerald-800"
      : status === "converted"
        ? "bg-violet-50 text-violet-800"
        : status === "disqualified" || status === "duplicate"
          ? "bg-slate-100 text-slate-600"
          : status === "reviewing"
            ? "bg-blue-50 text-blue-800"
            : "bg-amber-50 text-amber-800";
  return (
    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${color}`}>
      {LEAD_STATUS_LABELS[status as LeadStatusValue] ?? status}
    </span>
  );
}

function sortValue(lead: Lead, key: SortKey): string {
  switch (key) {
    case "company":
      return (lead.company_name ?? "").toLowerCase();
    case "contact":
      return (lead.contact_name ?? lead.email ?? "").toLowerCase();
    case "source":
      return normalizeLeadSource(lead.source);
    case "status":
      return lead.status;
    case "required_type":
      return (lead.property_category_preference ?? "").toLowerCase();
    case "required_subtype":
      return (lead.property_type_preference ?? "").toLowerCase();
    case "location":
      return (lead.preferred_location ?? "").toLowerCase();
    case "owner":
      return (lead.assigned_owner ?? "").toLowerCase();
    case "updated":
      return lead.updated_at ?? "";
    default:
      return "";
  }
}

export function LeadsPageClient({
  leads,
  companies,
  contacts,
  selectedLead,
}: {
  leads: Lead[];
  companies: CompanyOption[];
  contacts: ContactOption[];
  selectedLead: Lead | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const createOpen = searchParams.get("new") === "1";

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [source, setSource] = useState(searchParams.get("source") ?? "");
  const [requiredType, setRequiredType] = useState(searchParams.get("required_type") ?? "");
  const [requiredSubtype, setRequiredSubtype] = useState(searchParams.get("required_subtype") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const subtypeFilterOptions = useMemo(() => {
    if (!requiredType) return [];
    return REQUIREMENT_SUBTYPE_OPTIONS[requiredType as RequirementPrimaryType] ?? [];
  }, [requiredType]);

  function pushFilters(next: {
    q?: string;
    status?: string;
    source?: string;
    required_type?: string;
    required_subtype?: string;
    location?: string;
    lead?: string | null;
    new?: string | null;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const apply = (key: string, value: string | null | undefined) => {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    };
    if ("q" in next) apply("q", next.q);
    if ("status" in next) apply("status", next.status);
    if ("source" in next) apply("source", next.source);
    if ("required_type" in next) apply("required_type", next.required_type);
    if ("required_subtype" in next) apply("required_subtype", next.required_subtype);
    if ("location" in next) apply("location", next.location);
    if ("lead" in next) apply("lead", next.lead);
    if ("new" in next) apply("new", next.new);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const locationQuery = location.trim().toLowerCase();
    return leads.filter((lead) => {
      if (status && lead.status !== status) return false;
      if (source && normalizeLeadSource(lead.source) !== source) return false;
      if (
        requiredType &&
        !(lead.property_category_preference ?? "")
          .toLowerCase()
          .split(/[,;/|]/)
          .map((p) => p.trim())
          .includes(requiredType)
      ) {
        return false;
      }
      if (
        requiredSubtype &&
        !(lead.property_type_preference ?? "")
          .toLowerCase()
          .split(/[,;/|]/)
          .map((p) => p.trim())
          .includes(requiredSubtype)
      ) {
        return false;
      }
      if (
        locationQuery &&
        !(lead.preferred_location ?? "").toLowerCase().includes(locationQuery)
      ) {
        return false;
      }
      if (!query) return true;
      return [
        lead.contact_name,
        lead.company_name,
        lead.email,
        lead.email_subject,
        lead.ai_digest,
        lead.preferred_location,
        lead.assigned_owner,
        lead.source,
        lead.status,
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [leads, location, q, requiredSubtype, requiredType, source, status]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return b.id - a.id;
    });
    return rows;
  }, [filtered, sortDir, sortKey]);

  function onSort(key: SortKey) {
    if (sortKey === key) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "updated" ? "desc" : "asc");
    }
  }

  const likelyCompany = selectedLead?.company_name
    ? companies.find(
        (company) =>
          company.company_name.trim().toLowerCase() ===
          selectedLead.company_name!.trim().toLowerCase(),
      )
    : null;

  const filtersActive = Boolean(q || status || source || requiredType || requiredSubtype || location);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              pushFilters({ q: e.target.value });
            }}
            placeholder="Search company, contact, email…"
            aria-label="Search leads"
            className={`${fieldClass} min-w-[14rem] flex-1`}
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              pushFilters({ status: e.target.value });
            }}
            aria-label="Status"
            className={`${fieldClass} w-auto min-w-[8.5rem]`}
          >
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((value) => (
              <option key={value} value={value}>
                {LEAD_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              pushFilters({ source: e.target.value });
            }}
            aria-label="Lead Source"
            className={`${fieldClass} w-auto min-w-[8.5rem]`}
          >
            <option value="">All sources</option>
            {LEAD_SOURCES.map((value) => (
              <option key={value} value={value}>
                {LEAD_SOURCE_LABELS[value]}
              </option>
            ))}
          </select>
          <select
            value={requiredType}
            onChange={(e) => {
              const next = e.target.value;
              setRequiredType(next);
              setRequiredSubtype("");
              pushFilters({ required_type: next, required_subtype: "" });
            }}
            aria-label="Required Type"
            className={`${fieldClass} w-auto min-w-[8.5rem]`}
          >
            <option value="">All types</option>
            {OPPORTUNITY_CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={requiredSubtype}
            onChange={(e) => {
              setRequiredSubtype(e.target.value);
              pushFilters({ required_subtype: e.target.value });
            }}
            aria-label="Required Subtype"
            disabled={!requiredType}
            className={`${fieldClass} w-auto min-w-[9rem] disabled:opacity-50`}
          >
            <option value="">All subtypes</option>
            {subtypeFilterOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="search"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              pushFilters({ location: e.target.value });
            }}
            placeholder="Location"
            aria-label="Location"
            className={`${fieldClass} w-[10rem] shrink-0`}
          />
          {filtersActive ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setStatus("");
                setSource("");
                setRequiredType("");
                setRequiredSubtype("");
                setLocation("");
                pushFilters({
                  q: "",
                  status: "",
                  source: "",
                  required_type: "",
                  required_subtype: "",
                  location: "",
                });
              }}
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              Reset
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {sorted.length} of {leads.length} leads
        </p>
      </div>

      {createOpen ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">New Lead</h2>
            <Link
              href="/admin/leads"
              className="text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              Close
            </Link>
          </div>
          <LeadForm action={createLeadAction} startWithCapture />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <SortableTableHeader label="Company" sortKey="company" activeKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortableTableHeader label="Contact" sortKey="contact" activeKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortableTableHeader label="Lead Source" sortKey="source" activeKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortableTableHeader label="Status" sortKey="status" activeKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortableTableHeader label="Required Type" sortKey="required_type" activeKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortableTableHeader label="Required Subtype" sortKey="required_subtype" activeKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortableTableHeader label="Location" sortKey="location" activeKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortableTableHeader label="Owner" sortKey="owner" activeKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortableTableHeader label="Updated" sortKey="updated" activeKey={sortKey} sortDir={sortDir} onSort={onSort} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((lead) => {
                const selected = selectedLead?.id === lead.id;
                return (
                  <tr
                    key={lead.id}
                    onClick={() => pushFilters({ lead: String(lead.id), new: null })}
                    className={`cursor-pointer border-b border-slate-100 hover:bg-amber-50/50 ${
                      selected ? "bg-amber-50" : ""
                    }`}
                  >
                    <td className="px-3 py-2.5 font-medium text-slate-900" onClick={(e) => e.stopPropagation()}>
                      <AdminEntityLink
                        href={
                          lead.converted_company_id
                            ? companyFullPageHref(lead.converted_company_id)
                            : leadFullPageHref(lead.id)
                        }
                        className="text-inherit underline-offset-2 hover:underline"
                      >
                        {lead.company_name}
                      </AdminEntityLink>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700" onClick={(e) => e.stopPropagation()}>
                      <AdminEntityLink
                        href={
                          lead.converted_contact_id
                            ? contactFullPageHref(lead.converted_contact_id)
                            : leadFullPageHref(lead.id)
                        }
                        className="text-inherit underline-offset-2 hover:underline"
                      >
                        {lead.contact_name ?? lead.email}
                      </AdminEntityLink>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {LEAD_SOURCE_LABELS[normalizeLeadSource(lead.source)]}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {formatRequirementPrimaryTypes(lead.property_category_preference)}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {formatRequirementSubtypes(
                        lead.property_category_preference,
                        lead.property_type_preference,
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {lead.preferred_location?.trim() || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {lead.assigned_owner?.trim() || "—"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                      {lead.updated_at?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-slate-500">
                    No leads match the filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLead && !createOpen ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {selectedLead.company_name ??
                      selectedLead.contact_name ??
                      `Lead #${selectedLead.id}`}
                  </h2>
                  <StatusBadge status={selectedLead.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedLead.email_subject ?? selectedLead.email ?? "Lead details"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => pushFilters({ lead: null })}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
            {likelyCompany && selectedLead.status !== "converted" ? (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Possible existing company:{" "}
                <AdminEntityLink
                  href={companyFullPageHref(likelyCompany.business_id ?? likelyCompany.id)}
                  className="font-semibold underline"
                >
                  {likelyCompany.company_name}
                </AdminEntityLink>
              </p>
            ) : null}
            <LeadForm
              lead={selectedLead}
              action={updateLeadAction.bind(null, selectedLead.id)}
            />
          </div>

          <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-5">
            <h3 className="font-semibold text-violet-950">Convert Qualified Lead</h3>
            {selectedLead.status === "converted" ? (
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                <AdminEntityLink
                  href={companyFullPageHref(selectedLead.converted_company_id)}
                  className="rounded-lg bg-white px-3 py-2 text-violet-800 ring-1 ring-violet-200"
                >
                  Open Company
                </AdminEntityLink>
                <AdminEntityLink
                  href={contactFullPageHref(selectedLead.converted_contact_id)}
                  className="rounded-lg bg-white px-3 py-2 text-violet-800 ring-1 ring-violet-200"
                >
                  Open Contact
                </AdminEntityLink>
                <AdminEntityLink
                  href={opportunityFullPageHref(selectedLead.converted_opportunity_id)}
                  className="rounded-lg bg-violet-700 px-3 py-2 text-white"
                >
                  Open Opportunity
                </AdminEntityLink>
              </div>
            ) : (
              <>
                <p className="mt-1 text-sm text-violet-800">
                  First resolve the Company (Account) and Contact, then create the linked Opportunity.
                </p>
                <form
                  action={convertLeadAction.bind(null, selectedLead.id)}
                  className="mt-4 grid gap-3 sm:grid-cols-2"
                >
                  <label>
                    <span className={labelClass}>Company / Account Resolution</span>
                    <select
                      name="existing_company_id"
                      defaultValue={likelyCompany?.id ?? ""}
                      className={`w-full ${fieldClass}`}
                    >
                      <option value="">
                        Create new Company: “{selectedLead.company_name ?? "company name required"}”
                      </option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          Map to existing: {company.company_name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className={labelClass}>Contact Resolution</span>
                    <select name="existing_contact_id" defaultValue="" className={`w-full ${fieldClass}`}>
                      <option value="">
                        Create new Contact: “
                        {selectedLead.contact_name ?? selectedLead.email ?? "new contact"}”
                      </option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          Map to existing: {contact.contact_name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Opportunity Owner</span>
                    <input
                      name="opportunity_owner"
                      defaultValue={selectedLead.assigned_owner ?? ""}
                      placeholder="Defaults to the Lead Owner"
                      className={`w-full ${fieldClass}`}
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={selectedLead.status !== "qualified"}
                      className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Convert to Company, Contact & Opportunity
                    </button>
                    {selectedLead.status !== "qualified" ? (
                      <p className="mt-2 text-xs text-violet-700">
                        Set the lead status to Qualified and save before conversion.
                      </p>
                    ) : null}
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
