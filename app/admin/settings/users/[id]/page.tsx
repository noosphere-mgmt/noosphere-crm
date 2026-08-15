import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCrmUser } from "@/lib/repos/crmUsers";
import { updateCrmUserAction } from "../actions";

export const dynamic = "force-dynamic";
const inputClass = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

export default async function EditCrmUserPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const userId = Number.parseInt(id, 10);
  if (!Number.isFinite(userId)) notFound();
  const user = await getCrmUser(userId);
  if (!user) notFound();
  const action = updateCrmUserAction.bind(null, user.id);

  return (
    <AdminShell title="Edit Staff" module="tools" wide>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/admin/settings/users" className="text-sm font-semibold text-violet-700 hover:underline">← CRM Users & Access</Link>
        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Edit mode</span>
      </div>
      {sp.saved ? <p className="mb-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Staff changes saved.</p> : null}
      <section className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 border-b border-slate-100 pb-4">
          <h1 className="text-xl font-semibold text-slate-900">{user.display_name}</h1>
          <p className="mt-1 text-sm text-slate-500">Staff ID: STF-{String(user.id).padStart(6, "0")} · Update identity, access and responsibilities.</p>
        </div>
        <form action={action} className="grid gap-3 sm:grid-cols-2">
          <label><span className="text-xs font-semibold text-slate-500">Staff name</span><input required name="display_name" defaultValue={user.display_name} className={inputClass} /></label>
          <label><span className="text-xs font-semibold text-slate-500">Email address</span><input name="email" type="email" defaultValue={user.email ?? ""} className={inputClass} /></label>
          <label><span className="text-xs font-semibold text-slate-500">User type</span><select name="user_type" defaultValue={user.user_type} className={inputClass}><option value="human">Human</option><option value="virtual">Virtual staff</option></select></label>
          <label><span className="text-xs font-semibold text-slate-500">Role</span><select name="role" defaultValue={user.role} className={inputClass}><option value="administrator">Administrator</option><option value="staff">Staff</option><option value="virtual_staff">Virtual staff</option><option value="view_only">View only</option></select></label>
          <label><span className="text-xs font-semibold text-slate-500">Channel</span><input name="channel" defaultValue={user.channel ?? ""} className={inputClass} /></label>
          <label><span className="text-xs font-semibold text-slate-500">Coverage</span><input name="coverage" defaultValue={user.coverage.join(", ")} className={inputClass} /></label>
          <label className="sm:col-span-2"><span className="text-xs font-semibold text-slate-500">AI instructions / responsibilities</span><textarea name="instructions" defaultValue={user.instructions ?? ""} rows={4} className={inputClass} /></label>
          <div className="flex flex-wrap gap-4 text-sm sm:col-span-2">
            <label><input type="checkbox" name="is_active" defaultChecked={user.is_active} /> Active</label>
            <label><input type="checkbox" name="login_enabled" defaultChecked={user.login_enabled} /> Interactive login</label>
            <label><input type="checkbox" name="api_enabled" defaultChecked={user.api_enabled} /> API access</label>
          </div>
          <div className="flex gap-2 pt-2 sm:col-span-2">
            <button className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">Save Changes</button>
            <Link href="/admin/settings/users" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</Link>
          </div>
        </form>
      </section>
    </AdminShell>
  );
}
