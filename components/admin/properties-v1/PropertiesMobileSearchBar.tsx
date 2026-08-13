"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { BUILDING_TITLES, PROPERTY_TYPES } from "@/lib/lookups";

export function PropertiesMobileSearchBar({
  initialQuery,
  initialCategory,
  initialTitle,
  initialRelatedCompany,
}: {
  initialQuery?: string;
  initialCategory?: string;
  initialTitle?: string;
  initialRelatedCompany?: string;
}) {
  const theme = moduleAccentClasses("properties");
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(initialQuery ?? "");
  const [relatedCompany, setRelatedCompany] = useState(initialRelatedCompany ?? "");
  const searchFocusedRef = useRef(false);
  const relatedFocusedRef = useRef(false);
  const lastPushedQRef = useRef((initialQuery ?? "").trim());
  const lastPushedRelatedRef = useRef((initialRelatedCompany ?? "").trim());

  function setFilter(key: "category" | "title", next: string) {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    params.delete("property");
    params.delete("mode");
    if (next) params.set(key, next);
    else params.delete(key);
    const qs = params.toString();
    startTransition(() =>
      router.replace(qs ? `/admin/properties/buildings?${qs}` : "/admin/properties/buildings"),
    );
  }

  useEffect(() => {
    const urlQ = (initialQuery ?? "").trim();
    if (searchFocusedRef.current) return;
    if (urlQ === lastPushedQRef.current) return;
    lastPushedQRef.current = urlQ;
    setValue(initialQuery ?? "");
  }, [initialQuery]);

  useEffect(() => {
    const urlRelated = (initialRelatedCompany ?? "").trim();
    if (relatedFocusedRef.current) return;
    if (urlRelated === lastPushedRelatedRef.current) return;
    lastPushedRelatedRef.current = urlRelated;
    setRelatedCompany(initialRelatedCompany ?? "");
  }, [initialRelatedCompany]);

  useEffect(() => {
    const trimmed = relatedCompany.trim();
    if (trimmed === lastPushedRelatedRef.current) return;
    const timer = window.setTimeout(() => {
      const next = relatedCompany.trim();
      if (next === lastPushedRelatedRef.current) return;
      lastPushedRelatedRef.current = next;
      const params = new URLSearchParams(searchParamsRef.current.toString());
      params.delete("property");
      params.delete("mode");
      if (next) params.set("related_company", next);
      else params.delete("related_company");
      const qs = params.toString();
      startTransition(() =>
        router.replace(qs ? `/admin/properties/buildings?${qs}` : "/admin/properties/buildings"),
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [relatedCompany, router]);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === lastPushedQRef.current) return;

    const timer = window.setTimeout(() => {
      const next = value.trim();
      if (next === lastPushedQRef.current) return;
      lastPushedQRef.current = next;
      const params = new URLSearchParams(searchParamsRef.current.toString());
      params.delete("property");
      params.delete("mode");
      if (next) params.set("q", next);
      else params.delete("q");
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `/admin/properties/buildings?${qs}` : "/admin/properties/buildings");
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [value, router]);

  return (
    <div className={`mb-2 grid grid-cols-2 gap-2 ${isPending ? "opacity-70" : ""}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => {
          searchFocusedRef.current = true;
        }}
        onBlur={() => {
          searchFocusedRef.current = false;
        }}
        placeholder="Search buildings — names, address, notes…"
        aria-label="Search buildings"
        autoComplete="off"
        className={`${theme.searchInput} w-full py-1.5 text-sm`}
      />
      <select
        aria-label="Building Type"
        value={initialCategory ?? ""}
        onChange={(event) => setFilter("category", event.target.value)}
        className={theme.searchSelect}
      >
        <option value="">Building Type</option>
        {PROPERTY_TYPES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <select
        aria-label="Building Title"
        value={initialTitle ?? ""}
        onChange={(event) => setFilter("title", event.target.value)}
        className={theme.searchSelect}
      >
        <option value="">Building Title</option>
        {BUILDING_TITLES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={relatedCompany}
        onChange={(event) => setRelatedCompany(event.target.value)}
        onFocus={() => {
          relatedFocusedRef.current = true;
        }}
        onBlur={() => {
          relatedFocusedRef.current = false;
        }}
        placeholder="Related company"
        aria-label="Related company"
        autoComplete="off"
        className={`${theme.searchInput} w-full py-1.5 text-sm`}
      />
    </div>
  );
}
