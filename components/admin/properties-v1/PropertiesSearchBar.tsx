"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

export function PropertiesSearchBar({ initialQuery }: { initialQuery?: string }) {
  const theme = moduleAccentClasses("properties");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(initialQuery ?? "");

  useEffect(() => {
    setValue(initialQuery ?? "");
  }, [initialQuery]);

  useEffect(() => {
    const trimmed = value.trim();
    const current = (initialQuery ?? "").trim();
    if (trimmed === current) return;

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("property");
      params.delete("mode");
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `/admin/properties/buildings?${qs}` : "/admin/properties/buildings");
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [value, initialQuery, router, searchParams]);

  return (
    <div className={`mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ${isPending ? "opacity-70" : ""}`}>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search building, address, district..."
        aria-label="Search properties"
        className={theme.searchInput}
      />
    </div>
  );
}
