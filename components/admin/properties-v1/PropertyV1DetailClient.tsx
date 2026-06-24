"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PropertiesV1Client } from "@/app/admin/properties/[id]/PropertiesV1Client";
import { InlineEditProvider, useInlineEdit } from "@/components/admin/inline/InlineEditProvider";
import { InlineSaveStatus } from "@/components/admin/inline/InlineRecordChrome";
import { AdminLoadWarningBanner } from "@/components/admin/AdminLoadWarningBanner";
import { ModuleActionBar, moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { IconPen } from "@/components/admin/ModuleActionIcons";
import { PropertyEditForm, propertyFormId } from "@/components/admin/properties-v1/PropertyEditForm";
import { PropertyInlineOverview } from "@/components/admin/properties-v1/PropertyInlineOverview";
import { composeAddressEnglish, hasAddressParts } from "@/lib/composeAddress";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import type { PremisesDrawerData } from "@/lib/repos/premisesDrawer";
import type { PropertyV1, PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

type TabKey = "property" | "premises";

function propertyTitle(property: PropertyV1): string {
  if (!property.property_id) return "New building";
  return property.bldg_name_en?.trim() || property.property_id;
}

function propertyAddressLine(property: PropertyV1): string | null {
  const parts = {
    streetNo: property.street_no,
    streetName: property.street_name_en,
    district: property.district_en,
    city: property.city_en,
  };
  if (hasAddressParts(parts)) return composeAddressEnglish(parts);
  return property.full_address_en?.trim() || property.full_address_zh?.trim() || null;
}

function PropertyPageHeader({
  property,
  tab,
  fullEditMode,
  onFullEdit,
  onCancelFullEdit,
  onSaveFullEdit,
}: {
  property: PropertyV1;
  tab: TabKey;
  fullEditMode: boolean;
  onFullEdit: () => void;
  onCancelFullEdit: () => void;
  onSaveFullEdit: () => void;
}) {
  const { editHighlight, setEditHighlight } = useInlineEdit();
  const theme = moduleAccentClasses("properties");
  const address = propertyAddressLine(property);
  const formId = propertyFormId(property);

  return (
    <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Properties</p>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{propertyTitle(property)}</h1>
        <RecordBusinessId id={property.business_id ?? property.property_id} className="mt-0.5 block" />
        {address ? (
          <p className="mt-1 text-sm leading-snug text-slate-600">{address}</p>
        ) : (
          <p className="mt-1 text-sm text-slate-400">Address will appear when location fields are filled.</p>
        )}
      </div>
      {tab === "property" ? (
        fullEditMode ? (
          <ModuleActionBar mode="edit" onCancel={onCancelFullEdit} onSave={onSaveFullEdit} formId={formId} />
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            <InlineSaveStatus />
            <button
              type="button"
              className={`${moduleEditButtonClass("properties")} ${editHighlight ? "ring-2 ring-[#FDE68A]" : ""}`}
              onClick={() => setEditHighlight(!editHighlight)}
              aria-label={editHighlight ? "Hide editable fields" : "Inline edit"}
              title={editHighlight ? "Hide editable fields" : "Inline edit"}
            >
              <IconPen />
            </button>
            <button
              type="button"
              onClick={onFullEdit}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${theme.secondaryButton}`}
            >
              Full edit
            </button>
          </div>
        )
      ) : null}
    </header>
  );
}

export function PropertyV1DetailClient({
  property,
  premises,
  companies,
  contacts,
  premisesDrawerData = null,
  propertyOptions = [],
  returnTo,
  loadWarnings = [],
}: {
  property: PropertyV1;
  premises: PremisesV1[];
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
  premisesDrawerData?: PremisesDrawerData | null;
  propertyOptions?: PropertyV1SelectOption[];
  embedded?: boolean;
  editMode?: boolean;
  onEditModeChange?: (edit: boolean) => void;
  returnTo?: string;
  loadWarnings?: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabKey>("property");
  const [fullEditMode, setFullEditMode] = useState(false);
  const submitRef = useRef<(() => void) | null>(null);
  const isNew = !property.property_id;
  const formId = propertyFormId(property);

  useEffect(() => {
    if (searchParams.get("premises")?.trim()) {
      setTab("premises");
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("mode") === "edit") {
      setFullEditMode(true);
    }
  }, [searchParams]);

  if (isNew) {
    return (
      <div className="space-y-4">
        <AdminLoadWarningBanner warnings={loadWarnings} />
        <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Properties</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">New building</h1>
          </div>
          <ModuleActionBar
            mode="edit"
            onCancel={() => {
              if (returnTo) router.push(returnTo);
              else router.push("/admin/properties/buildings");
            }}
            onSave={() => submitRef.current?.()}
            formId={formId}
          />
        </header>
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
    );
  }

  return (
    <InlineEditProvider resetKey={property.property_id}>
      <div className="space-y-4">
        <PropertyPageHeader
          property={property}
          tab={tab}
          fullEditMode={fullEditMode}
          onFullEdit={() => setFullEditMode(true)}
          onCancelFullEdit={() => {
            setFullEditMode(false);
            router.refresh();
          }}
          onSaveFullEdit={() => submitRef.current?.()}
        />

        <div className="flex flex-wrap gap-1 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setTab("property")}
            className={`rounded-t-lg px-2 py-1.5 text-xs font-semibold transition md:px-4 md:py-2 md:text-sm ${
              tab === "property"
                ? "border border-b-white border-slate-200 bg-white text-blue-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Property details
          </button>
          <button
            type="button"
            onClick={() => setTab("premises")}
            className={`rounded-t-lg px-2 py-1.5 text-xs font-semibold transition md:px-4 md:py-2 md:text-sm ${
              tab === "premises"
                ? "border border-b-white border-slate-200 bg-white text-blue-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Premises
            <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-px text-[10px] font-medium text-slate-600 md:ml-2 md:px-2 md:py-0.5 md:text-xs">
              {premises.length}
            </span>
          </button>
        </div>

        {tab === "property" ? (
          fullEditMode ? (
            <PropertyEditForm
              property={property}
              companies={companies}
              returnTo={returnTo}
              formId={formId}
              onRegisterSubmit={(submit) => {
                submitRef.current = submit;
              }}
            />
          ) : (
            <PropertyInlineOverview property={property} companies={companies} />
          )
        ) : (
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-slate-100" />}>
            <PropertiesV1Client
              propertyId={property.property_id}
              buildingName={property.bldg_name_en}
              premises={premises}
              companies={companies}
              contacts={contacts}
              propertyOptions={propertyOptions}
              drawerData={premisesDrawerData}
            />
          </Suspense>
        )}
      </div>
    </InlineEditProvider>
  );
}
