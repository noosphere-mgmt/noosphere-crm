import { redirect } from "next/navigation";

export default function OperatorsListPage() {
  redirect("/admin/companies?role=operator");
}
