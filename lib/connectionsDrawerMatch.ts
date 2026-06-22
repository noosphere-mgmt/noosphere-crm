/** True when URL ?company= / ?contact= matches loaded drawer record ids. */
export function drawerQueryMatchesLoadedRecord(
  openId: string,
  legacyId: number | string,
  v1Id?: string | null,
): boolean {
  const query = openId.trim();
  if (!query) return false;
  if (String(legacyId).trim() === query) return true;
  if (v1Id?.trim() === query) return true;
  return false;
}

/**
 * Show drawer when the server loaded data for the current URL query.
 * `drawerQuery` is the raw search param the server used to load `data`.
 */
export function shouldShowConnectionsDrawer<T>(
  openId: string | null | undefined,
  drawerQuery: string | null | undefined,
  data: T | null,
  legacyId?: number | string | null,
  v1Id?: string | null,
): data is T {
  if (!openId?.trim() || !data) return false;
  const query = openId.trim();
  if (drawerQuery?.trim() === query) return true;
  if (legacyId != null && drawerQueryMatchesLoadedRecord(query, legacyId, v1Id)) return true;
  return false;
}
