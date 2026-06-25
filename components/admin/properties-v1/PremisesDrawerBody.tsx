"use client";

import { useSearchParams } from "next/navigation";
import { PremisesFeesTab } from "@/components/admin/properties-v1/PremisesFeesTab";
import { PremisesInlineNotes, PremisesInlineOverview } from "@/components/admin/properties-v1/PremisesInlineOverview";
import { PremisesOpportunitiesTab } from "@/components/admin/properties-v1/PremisesOpportunitiesTab";
import { PremisesRelationshipsTab } from "@/components/admin/properties-v1/PremisesRelationshipsTab";
import { EntityActivitiesTab } from "@/components/admin/activities/EntityActivitiesTab";
import { countPremisesRelationships } from "@/lib/premisesRelationships";
import {
  asCompanyV1Options,
  asContactV1Options,
  normalizePremisesDrawerData,
} from "@/lib/premisesClientData";
import { formatPremisesName } from "@/lib/premisesDisplay";
import { getPremisesTab } from "@/lib/premisesDetailTab";
import type { PremisesDrawerData } from "@/lib/repos/premisesDrawer";
import type { PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

export function PremisesDrawerBody({
  premises,
  buildingName,
  drawerData,
  companyLabels,
  contactLabels,
  propertyOptions,
  companies,
  contacts,
  onAddRelationship,
  drawerBasePath = "/admin/properties",
}: {
  premises: PremisesV1;
  buildingName: string | null;
  drawerData: PremisesDrawerData;
  companyLabels: Map<string, string>;
  contactLabels: Map<string, string>;
  propertyOptions: PropertyV1SelectOption[];
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
  onAddRelationship: () => void;
  drawerBasePath?: string;
}) {
  const searchParams = useSearchParams();
  const tab = getPremisesTab({ tab: searchParams.get("tab") });
  const safeDrawerData = normalizePremisesDrawerData(drawerData);
  const safeCompanies = asCompanyV1Options(companies);
  const safeContacts = asContactV1Options(contacts);
  const counts = {
    relationships: countPremisesRelationships(premises),
    opportunities: safeDrawerData.proposed.length,
    fees: safeDrawerData.fees.lines.length,
  };

  return (
    <div className="space-y-4">
      {tab === "overview" ? (
        <PremisesInlineOverview
          premises={premises}
          buildingName={buildingName}
          propertyOptions={propertyOptions}
          companies={safeCompanies}
          relatedCounts={counts}
          companyLabels={companyLabels}
          lastActivityDate={safeDrawerData.lastActivityDate}
          drawerBasePath={drawerBasePath}
        />
      ) : tab === "relationships" ? (
        <PremisesRelationshipsTab
          premises={premises}
          companyLabels={companyLabels}
          contactLabels={contactLabels}
          companies={safeCompanies}
          contacts={safeContacts}
          onAddRelationship={onAddRelationship}
        />
      ) : tab === "opportunities" ? (
        <PremisesOpportunitiesTab rows={safeDrawerData.proposed} />
      ) : tab === "fees" ? (
        <PremisesFeesTab fees={safeDrawerData.fees} />
      ) : tab === "activities" ? (
        <EntityActivitiesTab
          activities={safeDrawerData.activities}
          defaults={{
            premises_business_id: premises.business_id ?? null,
            premises_label: formatPremisesName(buildingName, premises.floor, premises.unit),
          }}
        />
      ) : tab === "notes" ? (
        <PremisesInlineNotes premises={premises} />
      ) : null}
    </div>
  );
}
