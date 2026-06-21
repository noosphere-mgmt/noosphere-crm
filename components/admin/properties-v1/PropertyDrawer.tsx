"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { PropertiesV1Client } from "@/app/admin/properties/[id]/PropertiesV1Client";
import { InlineEditProvider } from "@/components/admin/inline/InlineEditProvider";
import { ModuleActionBar } from "@/components/admin/ModuleActionBar";
import { PropertyDrawerHeader } from "@/components/admin/properties-v1/PropertyDrawerHeader";
import { PropertyEditForm, propertyFormId } from "@/components/admin/properties-v1/PropertyEditForm";
import { PropertyInlineOverview } from "@/components/admin/properties-v1/PropertyInlineOverview";
import { composeAddressEnglish, hasAddressParts } from "@/lib/composeAddress";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import type { PropertyV1, PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

const overlayViewClass = "fixed inset-0 z-40 bg-slate-900/10 transition-opacity";
const overlayEditClass = "fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px] transition-opacity";
const panelViewClass =
  "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-slate-50 shadow-lg lg:w-[50vw] lg:max-w-3xl";
const panelEditClass =
  "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-slate-50 shadow-2xl lg:w-[75vw] lg:max-w-6xl";

export type PropertyDrawerMode = "view" | "edit";

type TabKey = "property" | "premises";

function propertyHeading(property: PropertyV1): string {
  return property.bldg_name_en?.trim() || property.property_id;
}

function propertySubtitle(property: PropertyV1): string | null {
  const parts = {
    streetNo: property.street_no,
    streetName: property.street_name_en,
    district: property.district_en,
    city: property.city_en,
  };
  if (hasAddressParts(parts)) return composeAddressEnglish(parts);
  return property.full_address_en?.trim() || property.title?.trim() || null;
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
  const [tab, setTab] = useState<TabKey>("property");
  const submitRef = useRef<(() => void) | null>(null);
  const formId = property ? propertyFormId(property) : "";

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
        {isView ? (
          <InlineEditProvider resetKey={property.property_id}>
            <PropertyDrawerHeader
              title={propertyHeading(property)}
              subtitle={propertySubtitle(property)}
              onClose={onClose}
              onFullEdit={() => onModeChange("edit")}
            />

            <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-white px-4 sm:px-5">
              <button
                type="button"
                onClick={() => setTab("property")}
                className={`rounded-t-lg px-3 py-2 text-sm font-semibold ${
                  tab === "property"
                    ? "border border-b-white border-slate-200 bg-white text-blue-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Property details
              </button>
              <button
                type="button"
                onClick={() => setTab("premises")}
                className={`rounded-t-lg px-3 py-2 text-sm font-semibold ${
                  tab === "premises"
                    ? "border border-b-white border-slate-200 bg-white text-blue-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Premises
                <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {premises.length}
                </span>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
              {tab === "property" ? (
                <PropertyInlineOverview property={property} companies={companies} />
              ) : (
                <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-slate-100" />}>
                  <PropertiesV1Client
                    propertyId={property.property_id}
                    buildingName={property.bldg_name_en}
                    premises={premises}
                    companies={companies}
                    contacts={contacts}
                    propertyOptions={propertyOptions}
                    drawerData={null}
                  />
                </Suspense>
              )}
            </div>
          </InlineEditProvider>
        ) : (
          <>
            <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Edit property</p>
                <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">{propertyHeading(property)}</h2>
              </div>
              <ModuleActionBar
                mode="edit"
                onCancel={() => onModeChange("view")}
                onSave={() => submitRef.current?.()}
                module="properties"
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
              <PropertyEditForm
                property={property}
                companies={companies}
                returnTo={returnTo}
                formId={formId}
                onRegisterSubmit={(submit) => {
                  submitRef.current = submit;
                }}
              />
            </div>
          </>
        )}
      </aside>
    </>
  );
}
