import { redirect } from "next/navigation";

export default function PremisesLegacyRedirect() {
  redirect("/admin/properties");
}
