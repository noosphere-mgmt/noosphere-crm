"use client";

import { Suspense, useEffect } from "react";
import { PropertyV1DetailClient } from "@/components/admin/properties-v1/PropertyV1DetailClient";
import { ModuleActionBar } from "@/components/admin/ModuleActionBar";
import { IconX } from "@/components/admin/ModuleActionIcons";
import type { PropertyV1, PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";

const overlayViewClass = "fixed inset-0 z-40 bg-slate-900/10 transition-opacity";
const overlayEditClass = "fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px] transition-opacity";
const panelViewClass =
  "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-slate-50 shadow-lg lg:w-[50vw] lg:max-w-3xl";
const panelEditClass =
  "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-slate-50 shadow-2xl lg:w-[75vw] lg:max-w-6xl";

export type PropertyDrawerMode = "view" | "edit";

function propertyHeading(property: PropertyV1): string {
  return property.bldg_name_en?.trim() || property.property_id;
}

export function PropertyDrawer({
  property,
  premises,
  companies,
  contacts,
  propertyOptions = [],
  mode,
  onClose,
  onModeChange,
  returnTo,
}: {
  property: PropertyV1 | null;
  premises: PremisesV1[];
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
  propertyOptions?: PropertyV1SelectOption[];
  mode: PropertyDrawerMode;
  onClose: () => void;
  onModeChange: (mode: PropertyDrawerMode) => void;
  returnTo?: string;
}) {
  const isOpen = property != null;
  const isView = mode === "view";
  const formId = property ? `property-form-${property.property_id}` : "";

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !property) return null;

  return (
    <>
      <button
        className={isView ? overlayViewClass : overlayEditClass}
        onClick={onClose}
        aria-label="Close property panel"
      />
      <aside
        className={isView ? panelViewClass : panelEditClass}
        role="dialog"
        aria-modal="true"
        aria-label={isView ? "View property" : "Edit property"}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">{isView ? "Review" : "Edit property"}</p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">{propertyHeading(property)}</h2>
            {property.title ? (
              <p className="mt-1 text-sm text-slate-600">{property.title}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {isView ? (
              <>
                <ModuleActionBar mode="view" onEdit={() => onModeChange("edit")} module="properties" />
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close"
                  title="Close"
                >
                  <IconX />
                </button>
              </>
            ) : (
              <ModuleActionBar
                mode="edit"
                formId={formId}
                onCancel={() => onModeChange("view")}
                module="properties"
              />
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
            <PropertyV1DetailClient
              property={property}
              premises={premises}
              companies={companies}
              contacts={contacts}
              propertyOptions={propertyOptions}
              embedded
              editMode={!isView}
              onEditModeChange={(edit) => onModeChange(edit ? "edit" : "view")}
              returnTo={returnTo}
            />
          </Suspense>
        </div>
      </aside>
    </>
  );
}
