export const ADMIN_COOKIE_NAME = "nr_admin";

export function encodeAdminCookieValue(token: string): string {
  return encodeURIComponent(token);
}

export function decodeAdminCookieValue(raw: string | undefined): string | undefined {
  if (raw == null || raw === "") return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
