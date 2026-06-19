import { redirect } from "next/navigation";

export default function AssetsListRedirect() {
  redirect("/admin/properties");
}
