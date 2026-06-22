import type { CompanyDetailTabId } from "@/lib/companyDetailTab";
import type { ContactDetailTabId } from "@/lib/contactDetailTab";
import { isV1CompanyRef, isV1ContactRef } from "@/lib/entityRefGuards";

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
  companyId: number | string,
  tab: CompanyDetailTabId = "overview",
  mode?: "edit" | "full",
): string {
  const ref = String(companyId).trim();
  if (isV1ContactRef(ref)) {
    return contactDrawerHref(basePath === "/admin/companies" ? "/admin/contacts" : basePath, searchParams, ref, tab as ContactDetailTabId);
  }

  const params = new URLSearchParams(searchParams.toString());
  params.set("company", ref);
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
  params.delete("contact");
  return `${basePath}?${params.toString()}`;
}

export function contactDrawerHref(
  basePath: string,
  searchParams: URLSearchParams,
  contactId: number | string,
  tab: ContactDetailTabId = "overview",
  mode?: "edit",
): string {
  const ref = String(contactId).trim();
  if (isV1CompanyRef(ref)) {
    return companyDrawerHref(
      basePath === "/admin/contacts" ? "/admin/companies" : basePath,
      searchParams,
      ref,
      "overview",
    );
  }

  const params = new URLSearchParams(searchParams.toString());
  params.set("contact", ref);
  if (tab === "overview") params.delete("tab");
  else params.set("tab", tab);
  if (mode === "edit") params.set("mode", "edit");
  else params.delete("mode");
  params.delete("new");
  params.delete("company");
  return `${basePath}?${params.toString()}`;
}

/** Route a list/detail click to the correct Connections drawer URL. */
export function connectionsContactNavHref(
  searchParams: URLSearchParams,
  entityRef: number | string,
  tab: ContactDetailTabId = "overview",
  mode?: "edit",
): string {
  return contactDrawerHref("/admin/contacts", searchParams, entityRef, tab, mode);
}

export function connectionsCompanyNavHref(
  searchParams: URLSearchParams,
  entityRef: number | string,
  tab: CompanyDetailTabId = "overview",
  mode?: "edit" | "full",
): string {
  return companyDrawerHref("/admin/companies", searchParams, entityRef, tab, mode);
}
