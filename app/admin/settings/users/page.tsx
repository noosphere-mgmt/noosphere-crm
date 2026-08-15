import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { createCrmUserAction, updateCrmUserAction } from "./actions";
import { listCrmUsers, type CrmUser } from "@/lib/repos/crmUsers";

export const dynamic = "force-dynamic";

const inputClass = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

function StaffForm({ user }: { user?: CrmUser }) {
  const editing = Boolean(user);
  const action = user ? updateCrmUserAction.bind(null, user.id) : createCrmUserAction;

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <label>
        <span className="text-xs font-semibold text-slate-500">Staff name</span>
        <input required name="display_name" defaultValue={user?.display_name} className={inputClass} />
      </label>
      <label>
        <span className="text-xs font-semibold text-slate-500">Email address</span>
        <input name="email" type="email" defaultValue={user?.email ?? ""} className={inputClass} />
      </label>
      <label>
        <span className="text-xs font-semibold text-slate-500">User type</span>
        <select name="user_type" defaultValue={user?.user_type ?? "human"} className={inputClass}>
          <option value="human">Human</option>
          <option value="virtual">Virtual staff</option>
        </select>
      </label>
      <label>
        <span className="text-xs font-semibold text-slate-500">Role</span>
        <select name="role" defaultValue={user?.role ?? "staff"} className={inputClass}>
          <option value="administrator">Administrator</option>
          <option value="staff">Staff</option>
          <option value="virtual_staff">Virtual staff</option>
          <option value="view_only">View only</option>
        </select>
      </label>
      <label>
        <span className="text-xs font-semibold text-slate-500">Channel</span>
        <input name="channel" defaultValue={user?.channel ?? ""} placeholder="Referral, serviced office…" className={inputClass} />
      </label>
      <label>
        <span className="text-xs font-semibold text-slate-500">Coverage</span>
        <input name="coverage" defaultValue={user?.coverage.join(", ") ?? ""} placeholder="Hong Kong, Singapore…" className={inputClass} />
      </label>
      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-slate-500">AI instructions / responsibilities</span>
        <textarea name="instructions" defaultValue={user?.instructions ?? ""} rows={3} className={inputClass} />
      </label>
      <div className="flex flex-wrap gap-4 text-sm sm:col-span-2">
        <label><input type="checkbox" name="is_active" defaultChecked={user?.is_active ?? true} /> Active</label>
        <label><input type="checkbox" name="login_enabled" defaultChecked={user?.login_enabled ?? false} /> Interactive login</label>
        <label><input type="checkbox" name="api_enabled" defaultChecked={user?.api_enabled ?? false} /> API access</label>
      </div>
      <div className="flex items-center gap-2 sm:col-span-2">
        <button className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">
          {editing ? "Save Changes" : "Add Staff"}
        </button>
        {editing ? (
          <Link href="/admin/settings/users" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </Link>
        ) : null}
      </div>
    </form>
  );
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ user?: string; saved?: string }> }) {
  const sp = await searchParams;
  const users = await listCrmUsers();
  const selectedId = Number.parseInt(sp.user ?? "", 10);
  const selected = users.find((user) => user.id === selectedId);

  return (
    <AdminShell title="CRM Users & Access" module="tools" wide>
      {sp.saved ? <p className="mb-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Staff changes saved.</p> : null}
      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b p-4">
            <div><h2 className="font-semibold">Staff</h2><p className="text-xs text-slate-500">{users.length} users</p></div>
            <Link href="/admin/settings/users" className="rounded-lg bg-violet-700 px-3 py-2 text-sm font-semibold text-white">+ Staff</Link>
          </div>
          {users.map((user) => {
            const active = selected?.id === user.id;
            return (
              <Link key={user.id} href={`/admin/settings/users/${user.id}`} className={`block border-b px-4 py-3 transition ${active ? "border-l-4 border-l-violet-500 bg-violet-50" : "hover:bg-slate-50"}`}>
                <div className="flex items-center justify-between gap-3">
                  <strong className="truncate">{user.display_name}</strong>
                  <span className={`text-xs ${user.is_active ? "text-emerald-700" : "text-slate-400"}`}>{user.is_active ? "Active" : "Inactive"}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-3">
                  <p className="truncate text-xs text-slate-500">STF-{String(user.id).padStart(6, "0")} · {user.user_type === "virtual" ? "Virtual staff" : "Human"} · {user.channel ?? user.role}</p>
                  <span className="shrink-0 text-xs font-semibold text-violet-700">Edit</span>
                </div>
              </Link>
            );
          })}
        </aside>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">{selected ? "Edit mode" : "New staff"}</p>
              <h2 className="mt-1 text-lg font-semibold">{selected ? `Edit ${selected.display_name}` : "Add CRM staff"}</h2>
            </div>
            {selected ? <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">Editing</span> : null}
          </div>
          <StaffForm key={selected?.id ?? "new"} user={selected} />
        </section>
      </div>
    </AdminShell>
  );
}
