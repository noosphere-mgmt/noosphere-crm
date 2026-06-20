export function formatImportRowNotes(
  errorMessage: string | null | undefined,
  warningMessage?: string | null | undefined,
): string {
  const parts = [errorMessage, warningMessage].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join("; ") : "—";
}
