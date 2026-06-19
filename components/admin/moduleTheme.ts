export type AdminModuleKey =
  | "dashboard"
  | "properties"
  | "connections"
  | "opportunities"
  | "activities"
  | "tools";

export type ModuleTheme = {
  pillActive: string;
  pillInactive: string;
  headerBar: string;
  primaryButton: string;
  secondaryButton: string;
  navActiveTitle: string;
  navActiveDesc: string;
  navActiveArrow: string;
  brandBar: string;
  tabActive: string;
  tabInactive: string;
  link: string;
  searchInput: string;
  searchSelect: string;
  filterPillActive: string;
  filterPillInactive: string;
  rowIconEdit: string;
  shellBg?: string;
};

const secondaryButton =
  "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

const pillInactive = "rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50";

const tabInactive = "rounded-md px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900";

const searchBase =
  "w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800 placeholder:text-slate-400";

const selectBase =
  "min-w-[8.5rem] rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-800";

export function moduleAccentClasses(module: AdminModuleKey | undefined): ModuleTheme {
  switch (module) {
    case "properties":
      return {
        pillActive: "border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8] shadow-sm",
        pillInactive,
        headerBar: "border-t-4 border-t-[#60A5FA]",
        primaryButton:
          "inline-flex items-center rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-40",
        secondaryButton,
        navActiveTitle: "text-[#1D4ED8]",
        navActiveDesc: "text-[#1D4ED8]/75",
        navActiveArrow: "text-[#1D4ED8]/80",
        brandBar: "border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
        tabActive:
          "rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 font-semibold text-[#1D4ED8] shadow-sm",
        tabInactive,
        link: "font-medium text-[#1D4ED8] hover:text-[#2563EB]",
        searchInput: `${searchBase} focus:border-[#60A5FA] focus:outline-none focus:ring-2 focus:ring-[#EFF6FF]`,
        searchSelect: `${selectBase} focus:border-[#60A5FA] focus:outline-none focus:ring-2 focus:ring-[#EFF6FF]`,
        filterPillActive: "rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8] ring-1 ring-[#BFDBFE]",
        filterPillInactive: pillInactive,
        rowIconEdit: "text-[#2563EB] hover:bg-[#EFF6FF]",
      };
    case "connections":
      return {
        pillActive: "border border-[#DDD6FE] bg-[#F5F3FF] text-[#5B21B6] shadow-sm",
        pillInactive,
        headerBar: "border-t-4 border-t-[#A78BFA]",
        primaryButton:
          "inline-flex items-center rounded-lg bg-[#7C3AED] px-3 py-2 text-sm font-semibold text-white hover:bg-[#5B21B6] disabled:cursor-not-allowed disabled:opacity-40",
        secondaryButton,
        navActiveTitle: "text-[#5B21B6]",
        navActiveDesc: "text-[#5B21B6]/75",
        navActiveArrow: "text-[#5B21B6]/80",
        brandBar: "border border-[#DDD6FE] bg-[#F5F3FF] text-[#5B21B6]",
        tabActive:
          "rounded-md border border-[#DDD6FE] bg-[#F5F3FF] px-3 py-1.5 font-semibold text-[#5B21B6] shadow-sm",
        tabInactive,
        link: "font-medium text-[#5B21B6] hover:text-[#7C3AED]",
        searchInput: `${searchBase} focus:border-[#A78BFA] focus:outline-none focus:ring-2 focus:ring-[#F5F3FF]`,
        searchSelect: `${selectBase} focus:border-[#A78BFA] focus:outline-none focus:ring-2 focus:ring-[#F5F3FF]`,
        filterPillActive:
          "rounded-full bg-[#F5F3FF] px-3 py-1 text-xs font-semibold text-[#5B21B6] ring-1 ring-[#DDD6FE]",
        filterPillInactive: pillInactive,
        rowIconEdit: "text-[#7C3AED] hover:bg-[#F5F3FF]",
        shellBg: "bg-gradient-to-b from-[#F5F3FF]/40 via-slate-50 to-slate-50",
      };
    case "opportunities":
      return {
        pillActive: "border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857] shadow-sm",
        pillInactive,
        headerBar: "border-t-4 border-t-[#34D399]",
        primaryButton:
          "inline-flex items-center rounded-lg bg-[#059669] px-3 py-2 text-sm font-semibold text-white hover:bg-[#047857] disabled:cursor-not-allowed disabled:opacity-40",
        secondaryButton,
        navActiveTitle: "text-[#047857]",
        navActiveDesc: "text-[#047857]/80",
        navActiveArrow: "text-[#047857]/80",
        brandBar: "border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
        tabActive:
          "rounded-md border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1.5 font-semibold text-[#047857] shadow-sm",
        tabInactive,
        link: "font-medium text-[#047857] hover:text-[#059669]",
        searchInput: `${searchBase} focus:border-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#ECFDF5]`,
        searchSelect: `${selectBase} focus:border-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#ECFDF5]`,
        filterPillActive:
          "rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-semibold text-[#047857] ring-1 ring-[#A7F3D0]",
        filterPillInactive: pillInactive,
        rowIconEdit: "text-[#059669] hover:bg-[#ECFDF5]",
      };
    case "activities":
      return {
        pillActive: "border border-[#FDE68A] bg-[#FFFBEB] text-[#B45309] shadow-sm",
        pillInactive,
        headerBar: "border-t-4 border-t-[#FBBF24]",
        primaryButton:
          "inline-flex items-center rounded-lg bg-[#D97706] px-3 py-2 text-sm font-semibold text-white hover:bg-[#B45309] disabled:cursor-not-allowed disabled:opacity-40",
        secondaryButton,
        navActiveTitle: "text-[#B45309]",
        navActiveDesc: "text-[#B45309]/80",
        navActiveArrow: "text-[#B45309]/80",
        brandBar: "border border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
        tabActive:
          "rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-3 py-1.5 font-semibold text-[#B45309] shadow-sm",
        tabInactive,
        link: "font-medium text-[#B45309] hover:text-[#D97706]",
        searchInput: `${searchBase} focus:border-[#FBBF24] focus:outline-none focus:ring-2 focus:ring-[#FFFBEB]`,
        searchSelect: `${selectBase} focus:border-[#FBBF24] focus:outline-none focus:ring-2 focus:ring-[#FFFBEB]`,
        filterPillActive:
          "rounded-full bg-[#FFFBEB] px-3 py-1 text-xs font-semibold text-[#B45309] ring-1 ring-[#FDE68A]",
        filterPillInactive: pillInactive,
        rowIconEdit: "text-[#D97706] hover:bg-[#FFFBEB]",
        shellBg: "bg-gradient-to-b from-[#FFFBEB]/50 via-slate-50 to-slate-50",
      };
    case "tools":
      return {
        pillActive: "border border-slate-300 bg-slate-100 text-slate-900 shadow-sm",
        pillInactive,
        headerBar: "border-t-4 border-t-slate-700",
        primaryButton:
          "inline-flex items-center rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40",
        secondaryButton,
        navActiveTitle: "text-slate-900",
        navActiveDesc: "text-slate-700",
        navActiveArrow: "text-slate-600",
        brandBar: "border border-slate-300 bg-slate-100 text-slate-900",
        tabActive: "rounded-md bg-slate-800 px-3 py-1.5 font-semibold text-white",
        tabInactive,
        link: "font-medium text-slate-900 hover:underline",
        searchInput: `${searchBase} focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100`,
        searchSelect: `${selectBase} focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100`,
        filterPillActive: "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-900 ring-1 ring-slate-300",
        filterPillInactive: pillInactive,
        rowIconEdit: "text-slate-800 hover:bg-slate-100",
      };
    case "dashboard":
    default:
      return {
        pillActive: "border border-slate-300 bg-slate-100 text-slate-900 shadow-sm",
        pillInactive,
        headerBar: "border-t-4 border-t-slate-800",
        primaryButton:
          "inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40",
        secondaryButton,
        navActiveTitle: "text-slate-900",
        navActiveDesc: "text-slate-700",
        navActiveArrow: "text-slate-600",
        brandBar: "border border-slate-300 bg-slate-100 text-slate-900",
        tabActive: "rounded-md bg-slate-900 px-3 py-1.5 font-semibold text-white",
        tabInactive,
        link: "font-medium text-slate-900 hover:underline",
        searchInput: `${searchBase} focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100`,
        searchSelect: `${selectBase} focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100`,
        filterPillActive: "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-900 ring-1 ring-slate-300",
        filterPillInactive: pillInactive,
        rowIconEdit: "text-slate-800 hover:bg-slate-100",
      };
  }
}

export function moduleTabClass(module: AdminModuleKey, active: boolean): string {
  const theme = moduleAccentClasses(module);
  return active ? theme.tabActive : theme.tabInactive;
}
