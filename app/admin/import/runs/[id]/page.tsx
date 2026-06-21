import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** Run detail page removed — history list holds downloads and bulk delete. */
export default async function ImportRunResultPage(_props: Props) {
  redirect("/admin/import/history");
}
