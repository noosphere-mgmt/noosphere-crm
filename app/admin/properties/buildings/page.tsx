import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AllBuildingsWorkspace } from "@/components/admin/properties-v1/AllBuildingsWorkspace";
import { listCompanyV1Options } from "@/lib/repos/companiesV1";
import { listContactV1Options } from "@/lib/repos/contactsV1";
import { listPremisesForPropertyV1 } from "@/lib/repos/premisesV1";
import { getPropertyV1, listPropertiesV1, listPropertyV1SelectOptions, countPropertiesV1 } from "@/lib/repos/propertiesV1";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; category?: string; title?: string; related_company?: string; property?: string; mode?: string }>;
};

export default async function AllPropertiesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const category = sp.category?.trim() || undefined;
  const title = sp.title?.trim() || undefined;
  const relatedCompany = sp.related_company?.trim() || undefined;
  const propertyId = sp.property?.trim() || undefined;

  const [rows, propertyOptions, companies, contacts, totalCount] = await Promise.all([
    listPropertiesV1({ q, category, title, related_company: relatedCompany }),
    listPropertyV1SelectOptions(),
    listCompanyV1Options(),
    listContactV1Options(),
    countPropertiesV1(),
  ]);

  const [selectedProperty, selectedPremises] = propertyId
    ? await Promise.all([getPropertyV1(propertyId), listPremisesForPropertyV1(propertyId)])
    : [null, []];

  if (selectedProperty?.merged_into_property_id) {
    const master = await getPropertyV1(selectedProperty.merged_into_property_id);
    if (master && !master.merged_into_property_id) {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (title) params.set("title", title);
      if (relatedCompany) params.set("related_company", relatedCompany);
      params.set("property", master.business_id || master.property_id);
      if (sp.mode) params.set("mode", sp.mode);
      redirect(`/admin/properties/buildings?${params.toString()}`);
    }
  }

  return (
    <AdminShell title="Properties" module="properties" wide hideHeader>
      <AllBuildingsWorkspace
        rows={rows}
        totalCount={totalCount}
        initialQuery={q}
        initialCategory={category}
        initialTitle={title}
        initialRelatedCompany={relatedCompany}
        selectedProperty={selectedProperty}
        selectedPremises={selectedPremises}
        propertyOptions={propertyOptions}
        companies={companies}
        contacts={contacts}
      />
    </AdminShell>
  );
}
