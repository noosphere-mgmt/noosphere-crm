import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { BuildingMergeNeedsPartner, BuildingMergeReview } from "@/components/admin/properties-v1/BuildingMergeReview";
import { parseBuildingMergeIds } from "@/lib/buildingMergeFields";
import { previewBuildingMerge } from "@/lib/repos/buildingMerge";
import { listCompanyV1Options } from "@/lib/repos/companiesV1";
import { listPropertyV1SelectOptions } from "@/lib/repos/propertiesV1";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ ids?: string }>;
};

export default async function BuildingMergePage({ searchParams }: Props) {
  const sp = await searchParams;
  const ids = parseBuildingMergeIds(sp.ids);
  const [companies, propertyOptions] = await Promise.all([
    listCompanyV1Options(),
    listPropertyV1SelectOptions(),
  ]);

  if (ids.length < 2) {
    return (
      <AdminShell title="Merge Buildings" module="properties" wide hideHeader>
        <BuildingMergeNeedsPartner existingId={ids[0] ?? null} propertyOptions={propertyOptions} />
      </AdminShell>
    );
  }

  const loaded = await previewBuildingMerge(ids)
    .then((data) => ({ data, error: null as string | null }))
    .catch((err: unknown) => ({
      data: null,
      error: err instanceof Error ? err.message : "Failed to load merge review",
    }));
  const preview = loaded.data;
  const previewError = loaded.error;

  return (
    <AdminShell title="Merge Buildings" module="properties" wide hideHeader>
      {preview ? (
        <BuildingMergeReview preview={preview} companies={companies} />
      ) : (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          {previewError}
          <div className="mt-3">
            <Link href="/admin/properties/buildings" className="font-semibold underline">
              Back to Buildings
            </Link>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
