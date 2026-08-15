"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MOBILE_MENU_ITEMS = [
  { label: "Leads", href: "/admin/leads", colour: "bg-amber-100 text-amber-800", mark: "L" },
  { label: "Opportunities", href: "/admin/opportunities", colour: "bg-emerald-100 text-emerald-800", mark: "O" },
  { label: "Buildings", href: "/admin/properties/buildings", colour: "bg-blue-100 text-blue-800", mark: "B" },
  { label: "Companies", href: "/admin/companies", colour: "bg-violet-100 text-violet-800", mark: "C" },
  { label: "Channel Tree", href: "/admin/connections/channel-tree", colour: "bg-violet-100 text-violet-800", mark: "T" },
] as const;

export function AdminMobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    function closeOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu"
        className={`flex h-9 w-10 items-center justify-center rounded-lg text-xl text-slate-700 transition ${
          open ? "bg-white shadow-sm ring-1 ring-slate-200" : "hover:bg-white/70"
        }`}
      >
        <span aria-hidden>☰</span>
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          {MOBILE_MENU_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition ${active ? "bg-slate-50" : "hover:bg-slate-50"}`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${item.colour}`}>{item.mark}</span>
                <span className="text-sm font-semibold text-slate-900">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
