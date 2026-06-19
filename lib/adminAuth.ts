export const DEV_ADMIN_TOKEN = "dev-admin";

export function getAdminToken(): string | null {
  const configured = process.env.ADMIN_TOKEN?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "development") return DEV_ADMIN_TOKEN;
  return null;
}
