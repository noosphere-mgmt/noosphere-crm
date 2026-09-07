"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { contactMatchesSelectSearch, selectableContactsForCompany } from "@/lib/contactCompanyFilter";
import { isSelectableContact } from "@/lib/contactVisibility";
import { resolveContactSelectValue, type LegacyContactSelectOption } from "@/lib/crmSelectOptions";
import type { CompanyOption } from "@/lib/repos/companies";
import type { ContactOption } from "@/lib/repos/contacts";

const selectClass = "mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900";
const selectReadOnlyClass = "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800";

export function OpportunityPartyContactSelect({
  companyId,
  contacts,
  companies,
  contactOptions,
  defaultContactId,
  onNewContact,
  instanceKey,
  fieldName = "contact_id",
  allowWithoutCompany = true,
  disabled = false,
  placeholder = "Search contact…",
  emptyLabel = "—",
}: {
  companyId: string;
  contacts: ContactOption[];
  companies: CompanyOption[];
  contactOptions: LegacyContactSelectOption[];
  defaultContactId?: string;
  onNewContact?: () => void;
  instanceKey: string;
  fieldName?: string;
  /** When true (default), contact can be chosen before/without a company. */
  allowWithoutCompany?: boolean;
  disabled?: boolean;
  placeholder?: string;
  emptyLabel?: string;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(
    () => selectableContactsForCompany(contacts, companyId, companies),
    [contacts, companyId, companies],
  );
  const optionByValue = useMemo(() => {
    const map = new Map<string, LegacyContactSelectOption>();
    for (const option of contactOptions) map.set(option.value, option);
    return map;
  }, [contactOptions]);
  const [contactId, setContactId] = useState(defaultContactId ?? "");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(
    () => contactOptions.find((option) => option.value === defaultContactId)?.label ?? "",
  );
  const [highlight, setHighlight] = useState(0);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const contactEnabled = !disabled && (allowWithoutCompany || Boolean(companyId));
  const selectedLabel = contactId ? optionByValue.get(contactId)?.label ?? "" : "";

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

  useEffect(() => {
    const nextId = defaultContactId ?? "";
    setContactId(nextId);
    setQuery(contactOptions.find((option) => option.value === nextId)?.label ?? "");
    setOpen(false);
  }, [instanceKey, defaultContactId]);

  useEffect(() => {
    setContactId((current) => {
      if (!current) return "";
      if (filtered.some((contact) => resolveContactSelectValue(contacts, contact.id) === current)) {
        return current;
      }
      const saved = defaultContactId ?? "";
      if (current === saved && saved) {
        const historical = contacts.find(
          (contact) => resolveContactSelectValue(contacts, contact.id) === current,
        );
        if (historical && !isSelectableContact(historical)) return current;
      }
      return "";
    });
  }, [companyId, contacts, defaultContactId, filtered]);

  useEffect(() => {
    if (!open) setQuery(selectedLabel);
  }, [open, selectedLabel]);

  const visible = useMemo(() => {
    const term = query.trim() === selectedLabel.trim() ? "" : query;
    return filtered.filter((contact) => {
      const value = resolveContactSelectValue(contacts, contact.id);
      return contactMatchesSelectSearch(contact, term, optionByValue.get(value));
    });
  }, [contacts, filtered, optionByValue, query, selectedLabel]);

  useEffect(() => {
    const selectedIndex = visible.findIndex(
      (contact) => resolveContactSelectValue(contacts, contact.id) === contactId,
    );
    const browsingAll = !query.trim() || query.trim() === selectedLabel.trim();
    if (browsingAll && selectedIndex >= 0) {
      setHighlight(selectedIndex + 1);
      return;
    }
    setHighlight(visible.length > 0 ? 1 : 0);
  }, [query, companyId, open, visible, contactId, contacts, selectedLabel]);

  useEffect(() => {
    if (!open) return;
    syncMenuPosition();
    const onScrollOrResize = () => syncMenuPosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, syncMenuPosition]);

  function selectContact(value: string) {
    setContactId(value);
    setOpen(false);
    const label = value ? optionByValue.get(value)?.label ?? "" : "";
    setQuery(label);
  }

  function commitQuery() {
    const term = query.trim();
    if (!term) {
      selectContact("");
      return;
    }
    if (term === selectedLabel.trim()) {
      setOpen(false);
      return;
    }
    const first = visible[0];
    if (first) {
      selectContact(resolveContactSelectValue(contacts, first.id));
      return;
    }
    setQuery(selectedLabel);
    setOpen(false);
  }

  const menu =
    open && contactEnabled && menuRect && typeof document !== "undefined"
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
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!contactId}
                className={`block w-full px-3 py-2 text-left text-sm ${
                  highlight === 0 ? "bg-emerald-50 text-slate-900" : "text-slate-500 hover:bg-slate-50"
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectContact("")}
              >
                {emptyLabel}
              </button>
            </li>
            {visible.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">No matching contacts</li>
            ) : (
              visible.map((contact, index) => {
                const value = resolveContactSelectValue(contacts, contact.id);
                const label = optionByValue.get(value)?.label ?? contact.contact_name;
                const optionIndex = index + 1;
                return (
                  <li key={contact.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={contactId === value}
                      className={`block w-full px-3 py-2 text-left text-sm ${
                        highlight === optionIndex
                          ? "bg-emerald-50 text-slate-900"
                          : "text-slate-900 hover:bg-slate-50"
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectContact(value)}
                    >
                      {label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>,
          document.body,
        )
      : null;

  const optionCount = visible.length + 1;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Contact</span>
        {onNewContact ? (
          <button
            type="button"
            onClick={onNewContact}
            disabled={!allowWithoutCompany && !companyId}
            className="text-xs font-medium text-emerald-800 hover:underline disabled:text-slate-400"
          >
            New
          </button>
        ) : null}
      </div>
      <input type="hidden" name={fieldName} value={contactId} />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={!contactEnabled}
        value={query}
        placeholder={placeholder}
        className={disabled ? selectReadOnlyClass : selectClass}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          syncMenuPosition();
        }}
        onFocus={() => {
          if (!contactEnabled) return;
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
            setQuery(selectedLabel);
            setOpen(false);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlight((current) => Math.min(current + 1, optionCount - 1));
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((current) => Math.max(current - 1, 0));
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            if (!open) {
              setOpen(true);
              return;
            }
            if (highlight === 0) {
              selectContact("");
              return;
            }
            const picked = visible[highlight - 1];
            if (picked) selectContact(resolveContactSelectValue(contacts, picked.id));
          }
        }}
      />
      {menu}
    </div>
  );
}
