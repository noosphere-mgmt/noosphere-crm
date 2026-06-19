import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function GlossaryPage() {
  const docPath = path.join(process.cwd(), "docs", "brokerage-model.md");
  let content = "";
  try {
    content = await readFile(docPath, "utf8");
  } catch {
    content = "Glossary file not found.";
  }

  return (
    <AdminShell title="Brokerage model glossary">
      <p className="mb-4 text-sm text-slate-600">
        Internal terms used across the Noosphere Real Estate admin.{" "}
        <Link href="/admin" className="font-medium text-slate-900 underline">
          Back to dashboard
        </Link>
      </p>
      <article className="prose prose-sm max-w-3xl rounded-xl border border-slate-200 bg-white p-6 prose-headings:text-slate-900 prose-p:text-slate-700">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800">{content}</pre>
      </article>
    </AdminShell>
  );
}
