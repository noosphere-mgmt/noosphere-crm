"use client";
import { useEffect, useMemo, useState } from "react";
type StaffOption = { id: number; display_name: string; user_type: "human" | "virtual"; role: string };
export function CrmStaffSelect({ label, name, defaultValue, filter = "all", defaultToPrimary = false, disabled = false, className = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm", onChange }: { label: string; name: string; defaultValue?: string | null; filter?: "all" | "human" | "virtual"; defaultToPrimary?: boolean; disabled?: boolean; className?: string; onChange?: (value: string) => void }) {
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [value, setValue] = useState(defaultValue?.trim() ?? "");
  useEffect(() => { setValue(defaultValue?.trim() ?? ""); }, [defaultValue]);
  useEffect(() => { let live = true; fetch("/api/admin/crm-users").then((response) => response.ok ? response.json() as Promise<StaffOption[]> : []).then((rows) => { if (live) setStaff(rows); }).catch(() => {}); return () => { live = false; }; }, []);
  const options = useMemo(() => staff.filter((user) => filter === "all" || user.user_type === filter), [staff, filter]);
  useEffect(() => { if (!defaultToPrimary || value || options.length === 0) return; const fallback = options.find((user) => user.display_name.trim().toLowerCase() === "teresa cheuk") ?? options[0]; if (fallback) { setValue(fallback.display_name); onChange?.(fallback.display_name); } }, [defaultToPrimary, value, options, onChange]);
  return <label className="block min-w-0"><span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span><select name={name} value={value} disabled={disabled} onChange={(event) => { setValue(event.target.value); onChange?.(event.target.value); }} className={className}><option value="">— Select staff —</option>{value && !options.some((user) => user.display_name === value) ? <option value={value}>{value} (historical)</option> : null}{options.map((user) => <option key={user.id} value={user.display_name}>{user.display_name}{user.user_type === "virtual" ? " · Virtual" : ""}</option>)}</select>{disabled ? <input type="hidden" name={name} value={value} /> : null}</label>;
}
