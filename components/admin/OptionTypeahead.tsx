"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { rankFuzzyOptions } from "@/lib/fuzzySearch";
import type { TypeaheadOption } from "@/lib/typeaheadOptions";

export type { TypeaheadOption };

const defaultInputClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900";
const readOnlyClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800";

export function OptionTypeahead(props: {
  label?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: TypeaheadOption[];
  placeholder?: string;
  emptyLabel?: string;
  allowEmpty?: boolean;
  required?: boolean;
  disabled?: boolean;
  instanceKey?: string;
  inputClassName?: string;
  labelClassName?: string;
  noMatchLabel?: string;
  maxResults?: number;
}) {
  return <OptionTypeaheadInner key={props.instanceKey ?? "typeahead"} {...props} />;
}

function OptionTypeaheadInner({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Search…",
  emptyLabel = "—",
  allowEmpty = true,
  required = false,
  disabled = false,
  inputClassName,
  labelClassName = "text-xs font-medium uppercase tracking-wide text-slate-500",
  noMatchLabel = "No matches",
  maxResults = 80,
}: {
  label?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: TypeaheadOption[];
  placeholder?: string;
  emptyLabel?: string;
  allowEmpty?: boolean;
  required?: boolean;
  disabled?: boolean;
  inputClassName?: string;
  labelClassName?: string;
  noMatchLabel?: string;
  maxResults?: number;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const optionByValue = useMemo(() => {
    const map = new Map<string, TypeaheadOption>();
    for (const option of options) map.set(option.value, option);
    return map;
  }, [options]);
  const selectedLabel = value ? optionByValue.get(value)?.label ?? "" : "";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selectedLabel);
  const [userHighlight, setUserHighlight] = useState<number | null>(null);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const syncMenuPosition = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const visible = useMemo(() => {
    const term = query.trim() === selectedLabel.trim() ? "" : query;
    return rankFuzzyOptions(
      options,
      term,
      (option) => [option.label, option.value, option.searchText, option.detail].filter(Boolean).join(" "),
      maxResults,
    );
  }, [maxResults, options, query, selectedLabel]);

  const emptyOffset = allowEmpty ? 1 : 0;
  const optionCount = visible.length + emptyOffset;
  const selectedIndex = visible.findIndex((option) => option.value === value);
  const browsingAll = !query.trim() || query.trim() === selectedLabel.trim();
  const defaultHighlight =
    browsingAll && selectedIndex >= 0
      ? selectedIndex + emptyOffset
      : visible.length > 0
        ? emptyOffset
        : 0;
  const highlight = userHighlight ?? defaultHighlight;

  useEffect(() => {
    if (!open || disabled) return;
    syncMenuPosition();
    const onScrollOrResize = () => syncMenuPosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [disabled, open, syncMenuPosition]);

  function closeWithLabel(labelText: string) {
    setQuery(labelText);
    setOpen(false);
    setUserHighlight(null);
  }

  function selectValue(next: string) {
    onChange(next);
    closeWithLabel(next ? optionByValue.get(next)?.label ?? "" : "");
  }

  function commitQuery() {
    const term = query.trim();
    if (!term) {
      if (allowEmpty || !required) {
        selectValue("");
        return;
      }
      closeWithLabel(selectedLabel);
      return;
    }
    if (term === selectedLabel.trim()) {
      closeWithLabel(selectedLabel);
      return;
    }
    const first = visible[0];
    if (first) {
      selectValue(first.value);
      return;
    }
    closeWithLabel(selectedLabel);
  }

  const menu =
    open && !disabled && menuRect && typeof document !== "undefined"
      ? createPortal(
          <ul
            id={listId}
            role="listbox"
            className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            style={{
              position: "fixed",
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
              zIndex: 80,
            }}
          >
            {allowEmpty ? (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={!value}
                  className={`block w-full px-3 py-2 text-left text-sm ${
                    highlight === 0 ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectValue("")}
                >
                  {emptyLabel}
                </button>
              </li>
            ) : null}
            {visible.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">{noMatchLabel}</li>
            ) : (
              visible.map((option, index) => {
                const optionIndex = index + emptyOffset;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={value === option.value}
                      className={`block w-full px-3 py-2 text-left text-sm ${
                        highlight === optionIndex
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-900 hover:bg-slate-50"
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectValue(option.value)}
                    >
                      <span className="block">{option.label}</span>
                      {option.detail ? (
                        <span className="mt-0.5 block text-xs text-slate-500">{option.detail}</span>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div>
      {label ? <span className={labelClassName}>{label}</span> : null}
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={disabled}
        required={required && !value}
        value={query}
        placeholder={placeholder}
        className={disabled ? readOnlyClass : inputClassName ?? defaultInputClass}
        onChange={(e) => {
          setQuery(e.target.value);
          setUserHighlight(null);
          setOpen(true);
          syncMenuPosition();
        }}
        onFocus={() => {
          if (disabled) return;
          setOpen(true);
          syncMenuPosition();
        }}
        onBlur={() => {
          window.setTimeout(() => {
            commitQuery();
          }, 120);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            closeWithLabel(selectedLabel);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setUserHighlight(Math.min(highlight + 1, Math.max(optionCount - 1, 0)));
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setUserHighlight(Math.max(highlight - 1, 0));
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            if (!open) {
              setOpen(true);
              return;
            }
            if (allowEmpty && highlight === 0) {
              selectValue("");
              return;
            }
            const picked = visible[highlight - emptyOffset];
            if (picked) selectValue(picked.value);
          }
        }}
      />
      {menu}
    </div>
  );
}
