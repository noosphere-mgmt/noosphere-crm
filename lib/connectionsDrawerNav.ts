import type { CompanyDetailTabId } from "@/lib/companyDetailTab";
import type { ContactDetailTabId } from "@/lib/contactDetailTab";

export function buildCompaniesReturnTo(searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("company");
  params.delete("tab");
  params.delete("mode");
  params.delete("add_contact");
  const qs = params.toString();
  return qs ? `/admin/companies?${qs}` : "/admin/companies";
}

export function buildContactsReturnTo(searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("contact");
  params.delete("tab");
  params.delete("mode");
  params.delete("new");
  params.delete("company_id");
  const qs = params.toString();
  return qs ? `/admin/contacts?${qs}` : "/admin/contacts";
}

export function companyDrawerHref(
  basePath: string,
  searchParams: URLSearchParams,
  companyId: number,
  tab: CompanyDetailTabId = "overview",
  mode?: "edit" | "full",
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set("company", String(companyId));
  if (tab === "overview") params.delete("tab");
  else {
    params.set("tab", tab);
    params.delete("mode");
  }
  if (tab === "overview") {
    if (mode === "edit") params.set("mode", "edit");
    else if (mode === "full") params.set("mode", "full");
    else params.delete("mode");
  }
  return `${basePath}?${params.toString()}`;
}

export function contactDrawerHref(
  basePath: string,
  searchParams: URLSearchParams,
  contactId: number,
  tab: ContactDetailTabId = "overview",
  mode?: "edit",
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set("contact", String(contactId));
  if (tab === "overview") params.delete("tab");
  else params.set("tab", tab);
  if (mode === "edit") params.set("mode", "edit");
  else params.delete("mode");
  params.delete("new");
  return `${basePath}?${params.toString()}`;
}
