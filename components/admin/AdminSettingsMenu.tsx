"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ADMIN_SETTINGS_ITEMS, isAdminSettingsActive } from "@/lib/adminNavItems";

export function AdminSettingsMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = isAdminSettingsActive(pathname);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
          active || open
            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
            : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu"
      >
        <span aria-hidden className="text-xl leading-none sm:hidden">
          ☰
        </span>
        <span aria-hidden className="hidden text-base leading-none sm:inline">
          ⚙
        </span>
        <span className="hidden sm:inline">Settings</span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-200"
        >
          {ADMIN_SETTINGS_ITEMS.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block cursor-pointer px-4 py-3 transition hover:bg-slate-50"
            >
              <p className="text-sm font-medium text-slate-900">{item.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
