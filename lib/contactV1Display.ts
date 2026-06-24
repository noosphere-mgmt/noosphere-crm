import { asArray } from "@/lib/asArray";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import { isPermanentBusinessId } from "@/lib/businessIds";

export type ContactV1SelectOption = {
  value: string;
  label: string;
  businessId: string;
  v1Id: string;
  legacyId: number | null;
};

/** Contact dropdown: value = permanent business ID (D100001). */
export function toContactV1SelectOptions(contacts: ContactV1Option[] | null | undefined): ContactV1SelectOption[] {
  return asArray<ContactV1Option>(contacts)
    .filter((c) => c.business_id)
    .map((c) => {
      const businessId = c.business_id!;
      const name = c.display_name?.trim() || businessId;
      return {
        value: businessId,
        label: `${name} (${businessId})`,
        businessId,
        v1Id: c.contact_id,
        legacyId: c.legacy_contact_id,
      };
    });
}

export function coerceContactIdToSelectValue(
  stored: string | null | undefined,
  options: ContactV1SelectOption[],
): string {
  const id = stored?.trim();
  if (!id) return "";
  if (options.some((o) => o.value === id)) return id;
  const byBusiness = options.find((o) => o.businessId === id);
  if (byBusiness) return byBusiness.value;
  const byV1 = options.find((o) => o.v1Id === id);
  if (byV1) return byV1.value;
  const byLegacy = options.find((o) => o.legacyId != null && String(o.legacyId) === id);
  if (byLegacy) return byLegacy.value;
  if (isPermanentBusinessId("contact", id)) return id;
  return "";
}
