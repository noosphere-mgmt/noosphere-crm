import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Canonical Connections entry — contacts listing is the module landing page. */
export default function ConnectionsLandingPage() {
  redirect("/admin/contacts");
}
