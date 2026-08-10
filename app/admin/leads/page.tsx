import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { createLeadAction, convertLeadAction, updateLeadAction } from "@/app/admin/leads/actions";
import { listCompanyOptions } from "@/lib/repos/companies";
import { listContactOptions } from "@/lib/repos/contacts";
import { getLead, listLeads, type Lead, type LeadStatus } from "@/lib/repos/leads";

export const dynamic = "force-dynamic";

const STATUSES: Array<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "nurture", label: "Nurture" },
  { value: "disqualified", label: "Disqualified" },
  { value: "duplicate", label: "Duplicate" },
];

const fieldClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

function Field({ label, name, defaultValue, type = "text", placeholder }: { label: string; name: string; defaultValue?: string | number | null; type?: string; placeholder?: string }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span><input name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} className={fieldClass} /></label>;
}

function TextArea({ label, name, defaultValue, placeholder, rows = 3 }: { label: string; name: string; defaultValue?: string | null; placeholder?: string; rows?: number }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span><textarea name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} rows={rows} className={fieldClass} /></label>;
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const color = status === "qualified" ? "bg-emerald-50 text-emerald-800" : status === "converted" ? "bg-violet-50 text-violet-800" : status === "disqualified" || status === "duplicate" ? "bg-slate-100 text-slate-600" : status === "reviewing" ? "bg-blue-50 text-blue-800" : "bg-amber-50 text-amber-800";
  return <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${color}`}>{STATUSES.find((item) => item.value === status)?.label ?? status}</span>;
}

function LeadForm({ lead, action }: { lead?: Lead; action: (formData: FormData) => void | Promise<void> }) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="mb-1 block text-xs font-semibold text-slate-500">Status</span><select name="status" defaultValue={lead?.status ?? "new"} className={fieldClass}>{STATUSES.filter((item) => item.value !== "converted" || lead?.status === "converted").map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <Field label="Source" name="source" defaultValue={lead?.source ?? "email"} />
        <Field label="Contact name" name="contact_name" defaultValue={lead?.contact_name} />
        <Field label="Company name" name="company_name" defaultValue={lead?.company_name} />
        <Field label="Email" name="email" type="email" defaultValue={lead?.email} />
        <Field label="Phone" name="phone" defaultValue={lead?.phone} />
        <Field label="Website" name="website" defaultValue={lead?.website} />
        <Field label="Email subject" name="email_subject" defaultValue={lead?.email_subject} />
      </div>

      <TextArea label="Email excerpt" name="email_excerpt" defaultValue={lead?.email_excerpt} placeholder="Paste the relevant email content here until IMAP is connected." />

      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-amber-800">Office requirement check</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block"><span className="mb-1 block text-xs font-semibold text-slate-500">Requires office space?</span><select name="office_space_required" defaultValue={lead?.office_space_required == null ? "unknown" : lead.office_space_required ? "yes" : "no"} className={fieldClass}><option value="unknown">To verify</option><option value="yes">Yes</option><option value="no">No</option></select></label>
          <Field label="Next lease expiry" name="next_lease_expiry" type="date" defaultValue={lead?.next_lease_expiry} />
          <Field label="Preferred location" name="preferred_location" defaultValue={lead?.preferred_location} />
          <Field label="Required area (sq.ft.)" name="required_area_sqft" type="number" defaultValue={lead?.required_area_sqft} />
          <Field label="Capacity (people)" name="required_capacity_pax" type="number" defaultValue={lead?.required_capacity_pax} />
          <Field label="Next follow-up" name="next_follow_up_date" type="date" defaultValue={lead?.next_follow_up_date} />
        </div>
      </div>

      <TextArea label="Requirement notes" name="requirement_notes" defaultValue={lead?.requirement_notes} />
      <TextArea label="AI digest" name="ai_digest" defaultValue={lead?.ai_digest} placeholder="The email workflow will store its concise conversation digest here." />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Lead owner" name="assigned_owner" defaultValue={lead?.assigned_owner} />
        <Field label="Virtual staff" name="virtual_staff" defaultValue={lead?.virtual_staff} />
        <Field label="Qualification score (0–100)" name="qualification_score" type="number" defaultValue={lead?.qualification_score} />
        <Field label="Last email" name="last_email_at" type="datetime-local" defaultValue={lead?.last_email_at?.slice(0, 16)} />
      </div>
      <TextArea label="Qualification reason" name="qualification_reason" defaultValue={lead?.qualification_reason} />
      <button type="submit" className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">{lead ? "Save lead" : "Create lead"}</button>
    </form>
  );
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ lead?: string; status?: string; q?: string; new?: string }> }) {
  const sp = await searchParams;
  const [allLeads, companies, contacts] = await Promise.all([listLeads(), listCompanyOptions(), listContactOptions()]);
  const status = sp.status && STATUSES.some((item) => item.value === sp.status) ? sp.status : "";
  const q = sp.q?.trim().toLowerCase() ?? "";
  const leads = allLeads.filter((lead) => (!status || lead.status === status) && (!q || [lead.contact_name, lead.company_name, lead.email, lead.email_subject, lead.ai_digest].some((value) => value?.toLowerCase().includes(q))));
  const requestedId = Number.parseInt(sp.lead ?? "", 10);
  const selected = Number.isFinite(requestedId) ? await getLead(requestedId) : leads[0] ?? null;
  const likelyCompany = selected?.company_name ? companies.find((company) => company.company_name.trim().toLowerCase() === selected.company_name!.trim().toLowerCase()) : null;

  return (
    <AdminShell title="Leads" module="opportunities" wide actions={<details open={sp.new === "1"} className="relative"><summary className="cursor-pointer list-none rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white">+ Lead</summary><div className="absolute right-0 z-30 mt-2 w-[min(48rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-5 shadow-xl"><LeadForm action={createLeadAction} /></div></details>}>
      <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
        <form className="flex flex-wrap gap-2" action="/admin/leads" method="get">
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Search company, contact, email or digest…" className={`${fieldClass} min-w-[16rem] flex-1`} />
          <select name="status" defaultValue={status} className={`${fieldClass} w-auto min-w-[9rem]`}><option value="">All statuses</option>{STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
          <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Filter</button>
          {(status || q) ? <Link href="/admin/leads" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500">Reset</Link> : null}
        </form>
      </div>

      <div className="grid min-h-[65vh] gap-4 lg:grid-cols-[23rem_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3"><p className="font-semibold text-slate-900">Email Lead Inbox</p><p className="text-xs text-slate-500">{leads.length} of {allLeads.length} leads</p></div>
          <div className="max-h-[72vh] overflow-y-auto">
            {leads.map((lead) => <Link key={lead.id} href={`/admin/leads?lead=${lead.id}${status ? `&status=${status}` : ""}`} className={`block border-b border-slate-100 px-4 py-3 hover:bg-amber-50/40 ${selected?.id === lead.id ? "bg-amber-50" : ""}`}><div className="flex items-start justify-between gap-2"><p className="truncate font-semibold text-slate-900">{lead.company_name ?? lead.contact_name ?? lead.email ?? `Lead #${lead.id}`}</p><StatusBadge status={lead.status} /></div><p className="mt-1 truncate text-xs text-slate-500">{lead.contact_name ?? lead.email ?? "Contact to identify"}</p><p className="mt-1 text-xs text-slate-500">Office: {lead.office_space_required == null ? "To verify" : lead.office_space_required ? "Required" : "No"}{lead.next_lease_expiry ? ` · Expiry ${lead.next_lease_expiry}` : ""}</p></Link>)}
            {leads.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-500">No leads match the filters.</p> : null}
          </div>
        </aside>

        <section className="min-w-0">
          {!selected ? <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">Create or select a lead.</div> : <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="text-xl font-semibold text-slate-900">{selected.company_name ?? selected.contact_name ?? `Lead #${selected.id}`}</h2><StatusBadge status={selected.status} /></div><p className="mt-1 text-sm text-slate-500">{selected.email_subject ?? selected.email ?? "Email details pending"}</p></div><p className="text-xs text-slate-400">Lead #{selected.id}</p></div>
              {likelyCompany && selected.status !== "converted" ? <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">Possible existing company: <Link href={`/admin/companies?company=${likelyCompany.business_id ?? likelyCompany.id}`} className="font-semibold underline">{likelyCompany.company_name}</Link></p> : null}
              <LeadForm lead={selected} action={updateLeadAction.bind(null, selected.id)} />
            </div>

            <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-5">
              <h3 className="font-semibold text-violet-950">Convert qualified lead</h3>
              {selected.status === "converted" ? <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold"><Link href={`/admin/companies?company=${selected.converted_company_id}`} className="rounded-lg bg-white px-3 py-2 text-violet-800 ring-1 ring-violet-200">Open Company</Link><Link href={`/admin/contacts?contact=${selected.converted_contact_id}`} className="rounded-lg bg-white px-3 py-2 text-violet-800 ring-1 ring-violet-200">Open Contact</Link><Link href={`/admin/opportunities/${selected.converted_opportunity_id}`} className="rounded-lg bg-violet-700 px-3 py-2 text-white">Open Opportunity</Link></div> : <>
                <p className="mt-1 text-sm text-violet-800">First resolve the Company (Account) and Contact, then create the linked Opportunity.</p>
                <form action={convertLeadAction.bind(null, selected.id)} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label><span className="mb-1 block text-xs font-semibold text-slate-500">Company / Account resolution</span><select name="existing_company_id" defaultValue={likelyCompany?.id ?? ""} className={fieldClass}><option value="">Create new Company: “{selected.company_name ?? "company name required"}”</option>{companies.map((company) => <option key={company.id} value={company.id}>Map to existing: {company.company_name}</option>)}</select></label>
                  <label><span className="mb-1 block text-xs font-semibold text-slate-500">Contact resolution</span><select name="existing_contact_id" defaultValue="" className={fieldClass}><option value="">Create new Contact: “{selected.contact_name ?? selected.email ?? "new contact"}”</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>Map to existing: {contact.contact_name}</option>)}</select></label>
                  <Field label="Opportunity owner" name="opportunity_owner" defaultValue={selected.assigned_owner} placeholder="Defaults to the Lead owner" />
                  <div className="sm:col-span-2"><button type="submit" disabled={selected.status !== "qualified"} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-40">Convert to Company, Contact & Opportunity</button>{selected.status !== "qualified" ? <p className="mt-2 text-xs text-violet-700">Set the lead status to Qualified and save before conversion.</p> : null}</div>
                </form>
              </>}
            </div>
          </div>}
        </section>
      </div>
    </AdminShell>
  );
}
