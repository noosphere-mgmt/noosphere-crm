"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const CREATE_ITEMS = [
  { label: "Lead", description: "Capture and qualify a new enquiry", href: "/admin/leads?new=1", mark: "L", colour: "bg-amber-100 text-amber-800" },
  { label: "Opportunity", description: "Open a new business requirement", href: "/admin/opportunities/new", mark: "O", colour: "bg-violet-100 text-violet-800" },
  { label: "Company", description: "Add an account or organisation", href: "/admin/companies/new", mark: "C", colour: "bg-emerald-100 text-emerald-800" },
  { label: "Contact", description: "Add a person and company connection", href: "/admin/contacts/new", mark: "P", colour: "bg-sky-100 text-sky-800" },
  { label: "Building", description: "Create a building record", href: "/admin/properties/buildings/new", mark: "B", colour: "bg-indigo-100 text-indigo-800" },
  { label: "Premise", description: "Add an available unit or space", href: "/admin/properties/premises/new", mark: "P", colour: "bg-cyan-100 text-cyan-800" },
  { label: "Activity", description: "Record a meaningful footprint", href: "/admin/activities?new=1", mark: "A", colour: "bg-rose-100 text-rose-800" },
] as const;

export function AdminQuickCreateMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
      >
        <span aria-hidden className="text-base leading-none">+</span>
        <span className="hidden sm:inline">Create</span>
        <span aria-hidden className={`hidden text-[10px] transition sm:inline ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open ? (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Create new</p>
          <div className="grid gap-1">
            {CREATE_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${item.colour}`}>{item.mark}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{item.label}</span>
                  <span className="block truncate text-xs text-slate-500">{item.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
