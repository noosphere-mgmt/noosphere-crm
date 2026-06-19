import { redirect } from "next/navigation";

export default function InventoryListRedirect() {
  redirect("/admin/properties");
}
