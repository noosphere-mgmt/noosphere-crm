/** Locale-formatted integer for listing counts (e.g. 3,456). */
export function formatListingCount(value: number): string {
  return value.toLocaleString();
}
