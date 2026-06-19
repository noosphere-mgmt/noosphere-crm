import { redirect } from "next/navigation";
import { getMarketablePropertyByLegacyInventoryId } from "@/lib/repos/marketableProperties";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function InventoryDetailRedirect({ params }: Props) {
  const { id: idRaw } = await params;
  const legacyId = Number.parseInt(idRaw, 10);
  if (!Number.isFinite(legacyId)) {
    redirect("/admin/properties");
  }

  const property = await getMarketablePropertyByLegacyInventoryId(legacyId);
  if (property) {
    redirect(`/admin/properties/${property.id}`);
  }
  redirect("/admin/properties");
}
