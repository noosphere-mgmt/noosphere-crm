"use client";

import { useEffect, useState } from "react";
import { SubmitButton } from "@/components/admin/AdminFormFields";
import { OpportunityFormFields } from "@/components/admin/OpportunityFormFields";
import { OpportunityCreationIntake } from "@/components/admin/opportunities/OpportunityCreationIntake";
import { FormEditingContext } from "@/components/admin/ModuleActionBar";
import { createOpportunityAction } from "@/app/admin/opportunities/actions";
import type { ContactOption } from "@/lib/repos/contacts";
import type { Opportunity } from "@/lib/types/entities";

type CompanyOption = { id: number; company_name: string };

const overlayClass = "fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px]";
const panelClass =
  "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl max-md:bottom-[calc(3.5rem+env(safe-area-inset-bottom))] sm:max-w-2xl lg:max-w-4xl";

export function OpportunityFormDrawer({
  open,
  onClose,
  companies,
  contacts,
  fixedCompanyId,
  returnTo,
  startWithCapture = false,
}: {
  open: boolean;
  onClose: () => void;
  companies: CompanyOption[];
  contacts: ContactOption[];
  fixedCompanyId?: number;
  returnTo?: string;
  startWithCapture?: boolean;
}) {
  const [formKey, setFormKey] = useState(0);
  const [intakeDefaults, setIntakeDefaults] = useState<Partial<Opportunity>>({});

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const defaults: Partial<Opportunity> = {
    ...(fixedCompanyId && fixedCompanyId > 0 ? { company_id: fixedCompanyId } : {}),
    ...intakeDefaults,
  };

  return (
    <>
      <button type="button" className={overlayClass} aria-label="Close" onClick={onClose} />
      <div className={panelClass} role="dialog" aria-modal="true" aria-labelledby="opportunity-drawer-title">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="opportunity-drawer-title" className="text-lg font-semibold text-slate-900">
            New opportunity
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
          <OpportunityCreationIntake
            initiallyOpen={startWithCapture}
            onApply={(next) => {
              setIntakeDefaults((current) => ({ ...current, ...next }));
              setFormKey((key) => key + 1);
            }}
          />
          <FormEditingContext.Provider value={true}>
            <form key={formKey} action={createOpportunityAction} className="space-y-5">
              {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}
              <OpportunityFormFields
                defaults={defaults as Opportunity}
                companies={companies}
                contacts={contacts}
              />
              <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                <SubmitButton label="Create Opportunity" />
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
