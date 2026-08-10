import { AdminShell } from "@/components/admin/AdminShell";
import { saveEmailConfigAction } from "@/app/admin/settings/configuration/actions";
import { getEmailConfig } from "@/lib/repos/emailConfig";

export const dynamic = "force-dynamic";
const input = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
function Field({ label, name, value, type="text" }: { label:string; name:string; value:string|number|null; type?:string }) {
  return <label><span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span><input className={input} name={name} type={type} defaultValue={value ?? ""} /></label>;
}

export default async function ConfigurationPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const config = await getEmailConfig();
  const passwordConfigured = Boolean(process.env.EMAIL_IMAP_PASSWORD);
  return <AdminShell title="Configuration" module="tools" wide>
    {sp.saved ? <p className="mb-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">Configuration saved.</p> : null}
    <form action={saveEmailConfigAction} className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Email & AI mailbox</h2><p className="mt-1 text-sm text-slate-500">Configure the mailbox that will feed the Lead Inbox. Saving does not start synchronisation until the connector is installed and enabled.</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${passwordConfigured ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{passwordConfigured ? "Password configured" : "Password not configured"}</span></div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Mailbox name" name="mailbox_name" value={config.mailbox_name} />
          <Field label="Email address" name="email_address" type="email" value={config.email_address} />
          <Field label="Username" name="imap_username" value={config.imap_username} />
          <Field label="IMAP server" name="imap_host" value={config.imap_host} />
          <Field label="IMAP port" name="imap_port" type="number" value={config.imap_port} />
          <Field label="Inbox folder" name="inbox_folder" value={config.inbox_folder} />
          <Field label="Sent folder" name="sent_folder" value={config.sent_folder} />
          <Field label="SMTP server" name="smtp_host" value={config.smtp_host} />
          <Field label="SMTP port" name="smtp_port" type="number" value={config.smtp_port} />
        </div>
        <div className="mt-3 flex flex-wrap gap-5 text-sm text-slate-700"><label className="flex items-center gap-2"><input type="checkbox" name="imap_tls" defaultChecked={config.imap_tls} /> IMAP SSL/TLS</label><label className="flex items-center gap-2"><input type="checkbox" name="smtp_tls" defaultChecked={config.smtp_tls} /> SMTP SSL/TLS</label></div>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">For security, the mailbox password is not stored in the CRM database. Configure it on the server as <strong>EMAIL_IMAP_PASSWORD</strong>. It will never be shown on this page.</div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Lead processing defaults</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3"><Field label="Default Lead owner" name="default_lead_owner" value={config.default_lead_owner} /><Field label="Default virtual staff" name="default_virtual_staff" value={config.default_virtual_staff} /><Field label="Initial sync period (days)" name="sync_days" type="number" value={config.sync_days} /></div>
        <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-700"><label className="flex items-center gap-2"><input type="checkbox" name="draft_only" defaultChecked={config.draft_only} /> Draft replies only</label><label className="flex items-center gap-2"><input type="checkbox" name="sync_enabled" defaultChecked={config.sync_enabled} disabled={!passwordConfigured} /> Enable synchronisation</label></div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Connection status</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-xs font-semibold text-slate-500">Last sync</dt><dd className="mt-1 text-slate-900">{config.last_sync_at ?? "Not synced"}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Status</dt><dd className="mt-1 text-slate-900">{config.last_sync_status ?? "Connector not started"}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Latest error</dt><dd className="mt-1 text-slate-900">{config.last_error ?? "None"}</dd></div></dl>
      </section>
      <button className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">Save configuration</button>
    </form>
  </AdminShell>;
}

