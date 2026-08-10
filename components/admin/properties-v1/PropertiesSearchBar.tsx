"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { BUILDING_TITLES, PROPERTY_TYPES } from "@/lib/lookups";

export function PropertiesSearchBar({ initialQuery, initialCategory, initialTitle, initialRelatedCompany }: { initialQuery?: string; initialCategory?: string; initialTitle?: string; initialRelatedCompany?: string }) {
  const theme = moduleAccentClasses("properties");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(initialQuery ?? "");
  const [relatedCompany, setRelatedCompany] = useState(initialRelatedCompany ?? "");

  function setFilter(key: "category" | "title", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("property");
    params.delete("mode");
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `/admin/properties/buildings?${qs}` : "/admin/properties/buildings");
    });
  }

  useEffect(() => {
    setValue(initialQuery ?? "");
  }, [initialQuery]);

  useEffect(() => {
    setRelatedCompany(initialRelatedCompany ?? "");
  }, [initialRelatedCompany]);

  useEffect(() => {
    const trimmed = relatedCompany.trim();
    const current = (initialRelatedCompany ?? "").trim();
    if (trimmed === current) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("property");
      params.delete("mode");
      if (trimmed) params.set("related_company", trimmed);
      else params.delete("related_company");
      const qs = params.toString();
      startTransition(() => router.replace(qs ? `/admin/properties/buildings?${qs}` : "/admin/properties/buildings"));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [relatedCompany, initialRelatedCompany, router, searchParams]);

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
    <div className={`mb-3 grid gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm lg:grid-cols-[minmax(16rem,1fr)_auto_auto_minmax(12rem,0.7fr)] ${isPending ? "opacity-70" : ""}`}>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search building, address, district..."
        aria-label="Search properties"
        className={theme.searchInput}
      />
      <select
        aria-label="Building Type"
        value={initialCategory ?? ""}
        onChange={(event) => setFilter("category", event.target.value)}
        className={theme.searchSelect}
      >
        <option value="">Building Type</option>
        {PROPERTY_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
      <select aria-label="Building Title" value={initialTitle ?? ""} onChange={(event) => setFilter("title", event.target.value)} className={theme.searchSelect}>
        <option value="">Building Title</option>
        {BUILDING_TITLES.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
      <input type="search" value={relatedCompany} onChange={(event) => setRelatedCompany(event.target.value)} placeholder="Related company" aria-label="Related company" className={theme.searchInput} />
    </div>
  );
}
