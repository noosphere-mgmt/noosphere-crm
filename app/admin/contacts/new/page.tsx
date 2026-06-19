import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ company_id?: string }> };

export default async function NewContactPage({ searchParams }: Props) {
  const { company_id } = await searchParams;
  const params = new URLSearchParams({ new: "1" });
  if (company_id) params.set("company_id", company_id);
  redirect(`/admin/contacts?${params.toString()}`);
}
