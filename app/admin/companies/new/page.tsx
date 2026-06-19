import { AdminShell } from "@/components/admin/AdminShell";
import { CancelLink, SubmitButton } from "@/components/admin/AdminFormFields";
import { CompanyFormFields } from "@/components/admin/CompanyFormFields";
import { createCompanyAction } from "../actions";

export default function NewCompanyPage() {
  return (
    <AdminShell title="New company">
      <form action={createCompanyAction} className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <CompanyFormFields />
        <div className="flex items-center gap-4 pt-2">
          <SubmitButton label="Create company" />
          <CancelLink href="/admin/companies" />
        </div>
      </form>
    </AdminShell>
  );
}
