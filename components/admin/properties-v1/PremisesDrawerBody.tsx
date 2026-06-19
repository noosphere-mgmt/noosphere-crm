"use client";

import { useSearchParams } from "next/navigation";
import { PremisesFeesTab } from "@/components/admin/properties-v1/PremisesFeesTab";
import { PremisesInlineNotes, PremisesInlineOverview } from "@/components/admin/properties-v1/PremisesInlineOverview";
import { PremisesOpportunitiesTab } from "@/components/admin/properties-v1/PremisesOpportunitiesTab";
import { PremisesRelationshipsTab } from "@/components/admin/properties-v1/PremisesRelationshipsTab";
import { EntityActivitiesTab } from "@/components/admin/activities/EntityActivitiesTab";
import { countPremisesRelationships } from "@/lib/premisesRelationships";
import { formatPremisesName } from "@/lib/premisesDisplay";
import { getPremisesTab } from "@/lib/premisesDetailTab";
import type { PremisesDrawerData } from "@/lib/repos/premisesDrawer";
import type { PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

export function PremisesDrawerBody({
  premises,
  buildingName,
  drawerData,
  companyLabels,
  contactLabels,
  propertyOptions,
  onAddRelationship,
  drawerBasePath = "/admin/properties",
}: {
  premises: PremisesV1;
  buildingName: string | null;
  drawerData: PremisesDrawerData;
  companyLabels: Map<string, string>;
  contactLabels: Map<string, string>;
  propertyOptions: PropertyV1SelectOption[];
  onAddRelationship: () => void;
  drawerBasePath?: string;
}) {
  const searchParams = useSearchParams();
  const tab = getPremisesTab({ tab: searchParams.get("tab") });
  const counts = {
    relationships: countPremisesRelationships(premises),
    opportunities: drawerData.proposed.length,
    fees: drawerData.fees.lines.length,
  };

  return (
    <div className="space-y-4">
      {tab === "overview" ? (
        <PremisesInlineOverview
          premises={premises}
          buildingName={buildingName}
          propertyOptions={propertyOptions}
          relatedCounts={counts}
          companyLabels={companyLabels}
          lastActivityDate={drawerData.lastActivityDate}
          drawerBasePath={drawerBasePath}
        />
      ) : tab === "relationships" ? (
        <PremisesRelationshipsTab
          premises={premises}
          companyLabels={companyLabels}
          contactLabels={contactLabels}
          onAddRelationship={onAddRelationship}
        />
      ) : tab === "opportunities" ? (
        <PremisesOpportunitiesTab rows={drawerData.proposed} />
      ) : tab === "fees" ? (
        <PremisesFeesTab fees={drawerData.fees} />
      ) : tab === "activities" ? (
        <EntityActivitiesTab
          activities={drawerData.activities}
          defaults={{
            premises_id: premises.premises_id,
            premises_label: formatPremisesName(buildingName, premises.floor, premises.unit),
          }}
        />
      ) : tab === "notes" ? (
        <PremisesInlineNotes premises={premises} />
      ) : null}
    </div>
  );
}
