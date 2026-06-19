import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  redirect("/admin/properties/buildings/new");
}
