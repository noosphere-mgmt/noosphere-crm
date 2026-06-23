import type { ContactV1Option } from "@/lib/repos/contactsV1";
import { isLegacyNumericRef, isV1ContactRef } from "@/lib/entityRefGuards";

export type ContactV1SelectOption = {
  value: string;
  label: string;
  v1Id: string;
  legacyId: number | null;
};

/** Premises source_contact_id uses v1 CONT-* in DB — option value is v1 id. */
export function toContactV1SelectOptions(contacts: ContactV1Option[]): ContactV1SelectOption[] {
  return contacts.map((c) => {
    const name = c.display_name?.trim() || c.contact_id;
    return {
      value: c.contact_id,
      label: `${name} (${c.contact_id})`,
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
  if (isLegacyNumericRef(id)) {
    const byLegacy = options.find((o) => o.legacyId != null && String(o.legacyId) === id);
    if (byLegacy) return byLegacy.value;
  }
  if (isV1ContactRef(id)) return id;
  return "";
}
