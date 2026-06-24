import { listCompanyV1Options, type CompanyV1Option } from "@/lib/repos/companiesV1";
import { listContactV1Options, type ContactV1Option } from "@/lib/repos/contactsV1";
import { rethrowNextNavigation } from "@/lib/nextNavigation";

export type PropertyFormOptionsLoad = {
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
  warnings: string[];
};

/** Load company/contact dropdown data; never redirect — return empty lists + warnings on failure. */
export async function loadPropertyFormOptions(): Promise<PropertyFormOptionsLoad> {
  const warnings: string[] = [];
  let companies: CompanyV1Option[] = [];
  let contacts: ContactV1Option[] = [];

  try {
    companies = await listCompanyV1Options();
  } catch (err) {
    rethrowNextNavigation(err);
    warnings.push(
      err instanceof Error ? err.message : "Company list could not be loaded — company dropdowns are empty.",
    );
  }

  try {
    contacts = await listContactV1Options();
  } catch (err) {
    rethrowNextNavigation(err);
    warnings.push(
      err instanceof Error ? err.message : "Contact list could not be loaded — contact dropdowns are empty.",
    );
  }

  return { companies, contacts, warnings };
}
