import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ company_id?: string }> };

export default async function NewOpportunityRedirect({ searchParams }: Props) {
  const { company_id } = await searchParams;
  const qs = company_id ? `?new=1&company_id=${company_id}` : "?new=1";
  redirect(`/admin/opportunities${qs}`);
}
