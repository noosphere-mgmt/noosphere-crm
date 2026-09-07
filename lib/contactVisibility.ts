/**
 * Canonical Contact-module visibility.
 *
 * The Contact list, Opportunity selector, and other contact pickers share this
 * rule. There is no separate archived/hidden/merged column: those states are
 * represented by `contacts.is_active = FALSE` (including soft-delete).
 */
export const CONTACT_INACTIVE_LABEL = "Inactive";

export function sqlContactListVisible(alias = "c"): string {
  return `${alias}.is_active IS TRUE`;
}

/** Selectable for new assignments. Missing `is_active` is treated as visible. */
export function isSelectableContact(contact: { is_active?: boolean | null }): boolean {
  return contact.is_active !== false;
}

export function contactVisibilitySuffix(isActive?: boolean | null): string {
  return isActive === false ? ` · ${CONTACT_INACTIVE_LABEL}` : "";
}
