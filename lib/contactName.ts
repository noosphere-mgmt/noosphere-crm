export function suggestDisplayName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

/** Western name plus optional Chinese segment for titles and display_name. */
export function composeContactDisplayName(input: {
  first_name?: string | null;
  last_name?: string | null;
  chinese_name?: string | null;
}): string {
  const western = suggestDisplayName(input.first_name ?? "", input.last_name ?? "");
  const chinese = input.chinese_name?.trim() ?? "";
  if (western && chinese) return `${western} | ${chinese}`;
  return western || chinese;
}

export function resolveContactName(input: {
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  chinese_name?: string | null;
  contact_name?: string | null;
}): string {
  const composed = composeContactDisplayName(input);
  if (composed) return composed;
  const display = input.display_name?.trim();
  if (display) return display;
  return input.contact_name?.trim() || "";
}

export function getContactLabel(contact: {
  display_name?: string | null;
  contact_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  chinese_name?: string | null;
}): string {
  const composed = composeContactDisplayName(contact);
  if (composed) return composed;
  return contact.display_name?.trim() || contact.contact_name?.trim() || "—";
}

export function syncContactDerivedNames<T extends {
  first_name?: string | null;
  last_name?: string | null;
  chinese_name?: string | null;
  display_name?: string | null;
  contact_name?: string | null;
}>(input: T): T {
  const composed = composeContactDisplayName(input);
  if (!composed) return input;
  return {
    ...input,
    display_name: composed,
    contact_name: composed,
  };
}
