"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminSettingsMenu } from "@/components/admin/AdminSettingsMenu";
import { AdminQuickCreateMenu } from "@/components/admin/AdminQuickCreateMenu";
import { AdminMobileMenu } from "@/components/admin/AdminMobileMenu";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/lib/adminNavItems";
import { moduleAccentClasses, type AdminModuleKey } from "@/components/admin/moduleTheme";

function TopNavLink({
  href,
  label,
  module,
}: {
  href: string;
  label: string;
  module: AdminModuleKey;
}) {
  const pathname = usePathname();
  const theme = moduleAccentClasses(module);
  const active = isAdminNavActive(pathname, { href, label, module });
  const accent = {
    Leads: {
      text: "text-amber-700",
      hover: "hover:bg-amber-50 hover:text-amber-800",
      line: "bg-amber-400",
    },
    Opportunities: {
      text: "text-emerald-700",
      hover: "hover:bg-emerald-50 hover:text-emerald-800",
      line: "bg-emerald-500",
    },
    Properties: {
      text: "text-blue-700",
      hover: "hover:bg-blue-50 hover:text-blue-800",
      line: "bg-blue-500",
    },
    Connections: {
      text: "text-violet-700",
      hover: "hover:bg-violet-50 hover:text-violet-800",
      line: "bg-violet-500",
    },
    Activities: {
      text: "text-rose-700",
      hover: "hover:bg-rose-50 hover:text-rose-800",
      line: "bg-rose-400",
    },
  }[label] ?? {
    text: theme.navActiveTitle,
    hover: "hover:bg-white/70 hover:text-slate-900",
    line: "bg-slate-400",
  };

  return (
    <Link
      href={href}
      className={`group relative whitespace-nowrap rounded-lg px-3 pb-2.5 pt-2 text-sm font-medium transition ${
        active
          ? `${accent.text} bg-white shadow-sm ring-1 ring-slate-200/80`
          : `text-slate-600 ${accent.hover}`
      }`}
    >
      {label}
      <span
        aria-hidden
        className={`absolute bottom-1 left-3 right-3 h-0.5 rounded-full transition-all ${accent.line} ${
          active ? "scale-x-100 opacity-100" : "scale-x-50 opacity-45 group-hover:scale-x-100 group-hover:opacity-100"
        }`}
      />
    </Link>
  );
}

export function AdminTopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#f4f6f8]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1800px] items-center gap-4 px-4 py-3 lg:gap-6 lg:px-6">
        <Link href="/admin" className="shrink-0">
          <p className="text-sm font-bold tracking-tight text-slate-900">NOOSPHERE CRM</p>
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex" aria-label="Main navigation">
          {ADMIN_NAV_ITEMS.map((item) => (
            <TopNavLink key={item.href} href={item.href} label={item.label} module={item.module} />
          ))}
        </nav>
        <div className="ml-auto lg:ml-0">
          <AdminQuickCreateMenu />
        </div>
        <div className="hidden lg:block">
          <AdminSettingsMenu />
        </div>
        <div className="lg:hidden">
          <AdminMobileMenu />
        </div>
      </div>
    </header>
  );
}
