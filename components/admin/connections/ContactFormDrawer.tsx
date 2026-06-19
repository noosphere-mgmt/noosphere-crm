"use client";

import { useEffect, useState } from "react";
import { SubmitButton } from "@/components/admin/AdminFormFields";
import { ContactFormFields } from "@/components/admin/ContactFormFields";
import { FormEditingContext } from "@/components/admin/ModuleActionBar";
import { createContactAction } from "@/app/admin/contacts/actions";

type CompanyOption = { id: number; company_name: string };

const overlayClass = "fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px]";
const panelClass =
  "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl sm:max-w-2xl lg:max-w-4xl";

export function ContactFormDrawer({
  open,
  onClose,
  companies,
  fixedCompanyId,
  returnTo,
}: {
  open: boolean;
  onClose: () => void;
  companies: CompanyOption[];
  fixedCompanyId?: number;
  returnTo?: string;
}) {
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setFormKey((k) => k + 1);
  }, [open, fixedCompanyId]);

  if (!open) return null;

  return (
    <>
      <button type="button" className={overlayClass} aria-label="Close" onClick={onClose} />
      <div className={panelClass} role="dialog" aria-modal="true" aria-labelledby="contact-drawer-title">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="contact-drawer-title" className="text-lg font-semibold text-slate-900">
            New contact
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <FormEditingContext.Provider value={true}>
            <form key={formKey} action={createContactAction} className="space-y-5">
              {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}
              <ContactFormFields
                companies={companies}
                fixedCompanyId={fixedCompanyId}
                layout="wide"
              />
              <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                <SubmitButton label="Create contact" />
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            </form>
          </FormEditingContext.Provider>
        </div>
      </div>
    </>
  );
}
