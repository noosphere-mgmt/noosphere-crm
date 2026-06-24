import { redirect } from "next/navigation";

/** Legacy alias — canonical new-building URL is /admin/properties/buildings/new */
export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  redirect("/admin/properties/buildings/new");
}
