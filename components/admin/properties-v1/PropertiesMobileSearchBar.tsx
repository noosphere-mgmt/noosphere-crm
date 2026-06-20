"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

export function PropertiesMobileSearchBar({ initialQuery }: { initialQuery?: string }) {
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
    <div className={`mb-2 ${isPending ? "opacity-70" : ""}`}>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search building, district, address, operator…"
        aria-label="Search buildings"
        className={`${theme.searchInput} w-full py-1.5 text-sm`}
      />
    </div>
  );
}
