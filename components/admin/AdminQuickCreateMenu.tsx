"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAdminRecordEditing } from "@/components/admin/AdminRecordEditContext";

const CREATE_ITEMS = [
  { label: "Lead", description: "Capture and qualify a new enquiry", href: "/admin/leads?new=1" },
  { label: "Opportunity", description: "Open a new business requirement", href: "/admin/opportunities/new" },
  { label: "Company", description: "Add an account or organisation", href: "/admin/companies/new" },
  { label: "Contact", description: "Add a person and company connection", href: "/admin/contacts/new" },
  { label: "Building", description: "Create a building record", href: "/admin/properties/buildings/new" },
  { label: "Premise", description: "Add an available unit or space", href: "/admin/properties/premises/new" },
  { label: "Activity", description: "Record a meaningful footprint", href: "/admin/activities?new=1" },
] as const;

export function AdminQuickCreateMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editing = useAdminRecordEditing();

  useEffect(() => {
    if (editing) setOpen(false);
  }, [editing]);

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

  // Hide while creating/editing so the sticky Save/Create action isn't confused with nav Create.
  if (editing) return null;

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Create"
        title="Create"
        className="inline-flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
      >
        Create
      </button>

      {open ? (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <div className="grid gap-0.5">
            {CREATE_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-lg px-3 py-2 transition hover:bg-slate-50"
              >
                <span className="block text-sm font-medium text-slate-800">{item.label}</span>
                <span className="block truncate text-xs text-slate-500">{item.description}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
