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

/** SQL: prefer display_name, else contact_name (casts avoid text/jsonb COALESCE errors). */
export function sqlContactDisplayName(columnPrefix = ""): string {
  const p = columnPrefix ? `${columnPrefix}.` : "";
  return `COALESCE(${p}display_name::text, ${p}contact_name::text)`;
}

/** SQL: display/contact name, then first+last, then Chinese name. */
export function sqlContactSearchLabel(columnPrefix = ""): string {
  const p = columnPrefix ? `${columnPrefix}.` : "";
  return `COALESCE(
    NULLIF(trim(${sqlContactDisplayName(columnPrefix)}), ''),
    NULLIF(btrim(COALESCE(${p}first_name::text, '') || ' ' || COALESCE(${p}last_name::text, '')), ''),
    NULLIF(trim(${p}chinese_name::text), ''),
    'Contact'
  )`;
}

/** SQL boolean: personal names, display/contact name, and business id. */
export function sqlContactNameSearch(
  columnPrefix: string,
  likeParam: string,
  idParam: string,
): string {
  const p = columnPrefix ? `${columnPrefix}.` : "";
  return `(
    COALESCE(${p}display_name::text, '') ILIKE ${likeParam}
    OR COALESCE(${p}contact_name::text, '') ILIKE ${likeParam}
    OR COALESCE(${p}first_name::text, '') ILIKE ${likeParam}
    OR COALESCE(${p}last_name::text, '') ILIKE ${likeParam}
    OR COALESCE(${p}chinese_name::text, '') ILIKE ${likeParam}
    OR btrim(COALESCE(${p}first_name::text, '') || ' ' || COALESCE(${p}last_name::text, '')) ILIKE ${likeParam}
    OR COALESCE(${p}business_id::text, '') ILIKE ${likeParam}
    OR ${p}id::text = ${idParam}
  )`;
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
