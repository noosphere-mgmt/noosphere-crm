/**
 * Next.js `redirect()` / `notFound()` throw special errors that must propagate.
 * Never wrap them in generic try/catch without rethrowing.
 */
export function isNextRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) return false;
  const digest = String((error as { digest: unknown }).digest);
  return digest.startsWith("NEXT_REDIRECT;");
}

export function isNextNotFoundError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) return false;
  const digest = String((error as { digest: unknown }).digest);
  return digest === "NEXT_NOT_FOUND" || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;404");
}

/** Rethrow Next.js navigation errors unchanged (redirect, notFound). */
export function rethrowNextNavigation(error: unknown): void {
  if (isNextRedirectError(error) || isNextNotFoundError(error)) {
    throw error;
  }
}

export function describeNextRedirect(error: unknown): string | null {
  if (!isNextRedirectError(error)) return null;
  const digest = String((error as { digest: string }).digest);
  const parts = digest.split(";");
  const url = parts.slice(2, -2).join(";");
  const type = parts[1] ?? "replace";
  return `${type} → ${url || "(unknown)"}`;
}
