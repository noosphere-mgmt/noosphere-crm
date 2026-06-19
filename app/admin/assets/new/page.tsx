import { redirect } from "next/navigation";

export default function NewAssetRedirect() {
  redirect("/admin/properties/new");
}
