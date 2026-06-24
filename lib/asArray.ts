/**
 * Coerce unknown values to a plain array for safe .filter/.map in UI.
 * Handles null, undefined, objects, strings, and JSON strings.
 */
export function asArray<T>(value: unknown): T[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      return asArray<T>(JSON.parse(trimmed) as unknown);
    } catch {
      return [];
    }
  }
  if (typeof value === "object") return [];
  return [];
}
