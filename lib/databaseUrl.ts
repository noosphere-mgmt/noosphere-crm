/**
 * Postgres connection for Noosphere Real Estate (separate from Office Directory).
 */
export function requireNoosphereDatabaseUrl(): string {
  const s = process.env.NOOSPHERE_DATABASE_URL?.trim();
  if (!s) {
    throw new Error(
      "NOOSPHERE_DATABASE_URL is not set. Configure a Postgres URL for database noosphere_realestate.",
    );
  }
  return s;
}
