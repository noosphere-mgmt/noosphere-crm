import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Canonical Connections entry — companies list is the module landing page. */
export default function ConnectionsLandingPage() {
  redirect("/admin/companies");
}
