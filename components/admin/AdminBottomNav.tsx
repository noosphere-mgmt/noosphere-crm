"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/lib/adminNavItems";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

function NavIcon({ module }: { module: Parameters<typeof moduleAccentClasses>[0] }) {
  const stroke = module === "dashboard" ? "#475569" : undefined;
  const color =
    module === "properties"
      ? "#2563eb"
      : module === "connections"
        ? "#7c3aed"
        : module === "opportunities"
          ? "#059669"
          : stroke ?? "#475569";

  if (module === "dashboard") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  if (module === "properties") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 20V9l8-5 8 5v11" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 20v-6h6v6" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  if (module === "connections") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="8" cy="9" r="3" stroke={color} strokeWidth="1.8" />
        <circle cx="16" cy="9" r="3" stroke={color} strokeWidth="1.8" />
        <path d="M3.5 19c.8-2.2 2.7-3.5 4.5-3.5S11.7 16.8 12.5 19M11.5 19c.8-2.2 2.7-3.5 4.5-3.5s3.7 1.3 4.5 3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3 4 7v6c0 4.4 3.4 7.7 8 9 4.6-1.3 8-4.6 8-9V7l-8-4Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.5 12.5 11 14l3.5-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AdminBottomNav() {
  const pathname = usePathname();
  const items = ADMIN_NAV_ITEMS.filter((item) => item.bottomNav);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main navigation"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const active = isAdminNavActive(pathname, item);
          const theme = moduleAccentClasses(item.module);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold transition ${
                active ? theme.navActiveTitle : "text-slate-500"
              }`}
            >
              <NavIcon module={item.module} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
