"use client";

import { moduleAccentClasses } from "@/components/admin/moduleTheme";

export function OpportunitiesSearchToolbarMobile({
  searchQuery,
  onSearchChange,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}) {
  const theme = moduleAccentClasses("opportunities");

  return (
    <div className="mb-2">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search client, company, contact, district…"
        aria-label="Search opportunities"
        className={`${theme.searchInput} py-1.5`}
      />
    </div>
  );
}
