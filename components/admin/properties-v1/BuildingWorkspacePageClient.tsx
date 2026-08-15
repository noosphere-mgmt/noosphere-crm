"use client";

import { Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PropertiesV1Client } from "@/app/admin/properties/[id]/PropertiesV1Client";
import { AdvisoryWorkspaceShell } from "@/components/admin/workspace/AdvisoryWorkspaceShell";
import { EntityActivityWorkspace } from "@/components/admin/activities/EntityActivityWorkspace";
import { BuildingWorkspaceHeader } from "@/components/admin/properties-v1/BuildingWorkspaceHeader";
import { BuildingWorkspaceTabs } from "@/components/admin/properties-v1/BuildingWorkspaceTabs";
import { BuildingProposalContentTab } from "@/components/admin/properties-v1/BuildingProposalContentTab";
import { PropertyEditForm, propertyFormId } from "@/components/admin/properties-v1/PropertyEditForm";
import { PropertyInlineOverview } from "@/components/admin/properties-v1/PropertyInlineOverview";
import { InlineEditProvider } from "@/components/admin/inline/InlineEditProvider";
import { ModuleStickyEditBar } from "@/components/admin/ModuleActionBar";
import { getBuildingWorkspaceTab } from "@/lib/buildingWorkspaceTab";
import { buildingWorkspaceHref } from "@/lib/buildingWorkspaceNav";
import type { ActivityListRow } from "@/lib/repos/activities";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import type { PropertyV1, PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

export function BuildingWorkspacePageClient({
  property,
  premises,
  companies,
  contacts,
  propertyOptions,
  activities,
  editMode,
  returnTo,
}: {
  property: PropertyV1;
  premises: PremisesV1[];
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
  propertyOptions: PropertyV1SelectOption[];
  activities: ActivityListRow[];
  editMode: boolean;
  returnTo: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = getBuildingWorkspaceTab({ tab: searchParams.get("tab") });
  const formId = propertyFormId(property);
  const submitRef = useRef<(() => void) | null>(null);
  const viewHref = buildingWorkspaceHref(property, tab, undefined, returnTo);
  const buildingLabel = property.bldg_name_en?.trim() || property.property_id;

  if (editMode && tab === "overview") {
    return (
      <div className="space-y-3 pt-14">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <PropertyEditForm
            property={property}
            companies={companies}
            formId={formId}
            returnTo={viewHref}
            onRegisterSubmit={(submit) => {
              submitRef.current = submit;
            }}
          />
        </div>
        <ModuleStickyEditBar
          formId={formId}
          onCancel={() => router.push(viewHref, { scroll: false })}
        />
      </div>
    );
  }

  function renderTab() {
    switch (tab) {
      case "overview":
        return <PropertyInlineOverview property={property} companies={companies} />;
      case "premises":
        return (
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
        );
      case "proposal":
        return <BuildingProposalContentTab property={property} companies={companies} />;
      case "activities":
        return (
          <EntityActivityWorkspace
            activities={activities}
            defaults={{
              premises_label: buildingLabel,
            }}
          />
        );
      default:
        return null;
    }
  }

  return (
    <InlineEditProvider resetKey={property.property_id}>
      <AdvisoryWorkspaceShell
        header={<BuildingWorkspaceHeader property={property} premisesCount={premises.length} returnTo={returnTo} />}
        tabs={<BuildingWorkspaceTabs property={property} premisesCount={premises.length} returnTo={returnTo} />}
        showAssistToggle={false}
      >
        {renderTab()}
      </AdvisoryWorkspaceShell>
    </InlineEditProvider>
  );
}
