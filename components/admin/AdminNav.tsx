"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/lib/adminNavItems";
import { moduleAccentClasses, type AdminModuleKey } from "@/components/admin/moduleTheme";

function NavLink({
  href,
  label,
  desc,
  module,
}: {
  href: string;
  label: string;
  desc: string;
  module: AdminModuleKey;
}) {
  const pathname = usePathname();
  const theme = moduleAccentClasses(module);
  const active = isAdminNavActive(pathname, { href, label, desc, module });

  return (
    <Link
      href={href}
      className={`group block rounded-xl border px-4 py-3 transition ${
        active
          ? theme.pillActive
          : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-base font-semibold ${active ? theme.navActiveTitle : "text-slate-900"}`}>
            {label}
          </p>
          <p className={`mt-1 text-sm ${active ? theme.navActiveDesc : "text-slate-600"}`}>{desc}</p>
        </div>
        <span className={`mt-0.5 text-lg ${active ? theme.navActiveArrow : "text-slate-400"}`}>→</span>
      </div>
    </Link>
  );
}

export function AdminNav() {
  return (
    <nav className="space-y-3">
      {ADMIN_NAV_ITEMS.map((link) => (
        <NavLink key={link.href} {...link} />
      ))}
    </nav>
  );
}
