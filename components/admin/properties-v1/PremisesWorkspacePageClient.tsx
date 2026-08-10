"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updatePremisesV1Action } from "@/app/admin/properties/actions";
import { FormEditingContext, ModuleActionBar } from "@/components/admin/ModuleActionBar";
import { AdvisoryWorkspaceShell } from "@/components/admin/workspace/AdvisoryWorkspaceShell";
import { InlineEditProvider } from "@/components/admin/inline/InlineEditProvider";
import { PropertyDrawer, type PropertyDrawerMode } from "@/components/admin/properties-v1/PropertyDrawer";
import { PremisesCommercialTermsTab } from "@/components/admin/properties-v1/PremisesCommercialTermsTab";
import { PremisesAvailabilityTab } from "@/components/admin/properties-v1/PremisesAvailabilityTab";
import { PremisesInlineOverview } from "@/components/admin/properties-v1/PremisesInlineOverview";
import { PremisesOpportunitiesTab } from "@/components/admin/properties-v1/PremisesOpportunitiesTab";
import { PremisesRelationshipsTab } from "@/components/admin/properties-v1/PremisesRelationshipsTab";
import { PremisesTimelineTab } from "@/components/admin/properties-v1/PremisesTimelineTab";
import { PremisesV1EditForm } from "@/components/admin/properties-v1/PremisesDrawer";
import { PremisesWorkspaceContextPanel } from "@/components/admin/properties-v1/PremisesWorkspaceContextPanel";
import { PremisesWorkspaceHeader } from "@/components/admin/properties-v1/PremisesWorkspaceHeader";
import { PremisesWorkspaceTabs } from "@/components/admin/properties-v1/PremisesWorkspaceTabs";
import { buildCompanyV1LabelMap, toCompanyV1SelectOptions } from "@/lib/companyV1Display";
import {
  asCompanyV1Options,
  asContactV1Options,
  normalizePremisesDrawerData,
} from "@/lib/premisesClientData";
import { countPremisesRelationships } from "@/lib/premisesRelationships";
import type { PremisesDetailTabId } from "@/lib/premisesDetailTab";
import { getPremisesWorkspaceTab, type PremisesWorkspaceTabId } from "@/lib/premisesWorkspaceTab";
import { premisesWorkspaceHref } from "@/lib/premisesWorkspaceNav";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import type { PremisesDrawerData } from "@/lib/repos/premisesDrawer";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import type { PropertyV1, PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import { formatPremisesName } from "@/lib/premisesDisplay";

export function PremisesWorkspacePageClient({
  premises,
  building,
  buildingPremises,
  drawerData,
  companies,
  contacts,
  propertyOptions,
  editMode,
  returnTo,
}: {
  premises: PremisesV1;
  building: PropertyV1 | null;
  buildingPremises: PremisesV1[];
  drawerData: PremisesDrawerData | null;
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
  propertyOptions: PropertyV1SelectOption[];
  editMode: boolean;
  returnTo: string;
}) {
  const router = useRouter();
  const [buildingDrawerOpen, setBuildingDrawerOpen] = useState(false);
  const [buildingDrawerMode, setBuildingDrawerMode] = useState<PropertyDrawerMode>("view");
  const searchParams = useSearchParams();
  const tab = getPremisesWorkspaceTab({ tab: searchParams.get("tab") });
  const data = normalizePremisesDrawerData(drawerData);
  const companyOptions = useMemo(() => toCompanyV1SelectOptions(asCompanyV1Options(companies)), [companies]);
  const companyLabels = useMemo(() => buildCompanyV1LabelMap(asCompanyV1Options(companies)), [companies]);
  const safeContacts = useMemo(() => asContactV1Options(contacts), [contacts]);
  const contactLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of safeContacts) {
      const name = c.display_name?.trim() || c.contact_id;
      map.set(c.contact_id, name);
      if (c.business_id?.trim()) map.set(c.business_id.trim(), name);
    }
    return map;
  }, [safeContacts]);
  const formId = `premises-form-${premises.premises_id}`;
  const viewHref = premisesWorkspaceHref(premises, tab, undefined, returnTo);
  const counts = {
    relationships: countPremisesRelationships(premises),
    deals: data.proposed.length,
  };
  const buildingName = building?.bldg_name_en ?? premises.property_name_en ?? null;

  function workspaceTabHref(legacyTab: PremisesDetailTabId): string {
    const map: Partial<Record<PremisesDetailTabId, PremisesWorkspaceTabId>> = {
      overview: "overview",
      relationships: "relationships",
      opportunities: "deals",
      activities: "activities",
      notes: "overview",
      fees: "overview",
    };
    return premisesWorkspaceHref(premises, map[legacyTab] ?? "overview", undefined, returnTo);
  }

  if (editMode) {
    return (
      <InlineEditProvider resetKey={premises.premises_id}>
        <div className="space-y-3 pb-20">
          <div className="sticky top-0 z-20 flex justify-end border-b border-slate-200 bg-[var(--admin-bg,#f8fafc)] py-2">
            <ModuleActionBar mode="edit" formId={formId} onCancel={() => router.push(viewHref, { scroll: false })} module="properties" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <FormEditingContext.Provider value={true}>
              <PremisesV1EditForm
                premises={premises}
                propertyId={premises.property_id}
                propertyOptions={propertyOptions}
                companyOptions={companyOptions}
                contacts={contacts}
                action={updatePremisesV1Action}
              />
            </FormEditingContext.Provider>
          </div>
          <div className="fixed bottom-4 right-4 z-40 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur">
            <ModuleActionBar mode="edit" formId={formId} onCancel={() => router.push(viewHref, { scroll: false })} module="properties" />
          </div>
        </div>
      </InlineEditProvider>
    );
  }

  function renderTab() {
    switch (tab) {
      case "overview":
        return (
          <div className="grid items-start gap-3 lg:grid-cols-2">
            <PremisesInlineOverview
              premises={premises}
              buildingName={buildingName}
              propertyOptions={propertyOptions}
              companies={asCompanyV1Options(companies)}
              relatedCounts={{
                relationships: counts.relationships,
                opportunities: counts.deals,
                fees: data.fees.lines.length,
              }}
              companyLabels={companyLabels}
              lastActivityDate={data.lastActivityDate}
              tabHrefFn={workspaceTabHref}
            />
            <PremisesAvailabilityTab premises={premises} />
            <PremisesCommercialTermsTab premises={premises} />
          </div>
        );
      case "relationships":
        return (
          <PremisesRelationshipsTab
            premises={premises}
            companyLabels={companyLabels}
            contactLabels={contactLabels}
            companies={asCompanyV1Options(companies)}
            contacts={safeContacts}
            onAddRelationship={() => undefined}
          />
        );
      case "deals":
        return <PremisesOpportunitiesTab rows={data.proposed} />;
      case "activities":
        return (
          <PremisesTimelineTab premises={premises} buildingName={buildingName} drawerData={data} />
        );
      default:
        return null;
    }
  }

  return (
    <InlineEditProvider initialEditHighlight resetKey={premises.premises_id}>
      <>
      <AdvisoryWorkspaceShell
        header={
          <PremisesWorkspaceHeader
            premises={premises}
            propertyOptions={propertyOptions}
            lastActivityDate={data.lastActivityDate}
            onOpenBuilding={building ? () => {
              setBuildingDrawerMode("view");
              setBuildingDrawerOpen(true);
            } : undefined}
            returnTo={returnTo}
          />
        }
        tabs={<PremisesWorkspaceTabs premises={premises} counts={counts} returnTo={returnTo} />}
        contextPanel={<PremisesWorkspaceContextPanel premises={premises} drawerData={data} returnTo={returnTo} />}
        showAssistToggle={false}
      >
        {renderTab()}
      </AdvisoryWorkspaceShell>
      <PropertyDrawer
        property={buildingDrawerOpen ? building : null}
        premises={buildingPremises}
        companies={companies}
        contacts={contacts}
        propertyOptions={propertyOptions}
        mode={buildingDrawerMode}
        onClose={() => setBuildingDrawerOpen(false)}
        onModeChange={setBuildingDrawerMode}
      />
      </>
    </InlineEditProvider>
  );
}
