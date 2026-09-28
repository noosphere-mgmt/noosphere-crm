export type CrmOwnerCandidate = {
  id: number;
  display_name: string;
  user_type: string;
  login_enabled: boolean;
  is_active: boolean;
};

/**
 * Prefer the active human who can log in, then any active human, then any
 * active user. The stored owner value remains that user's display name.
 * Callers must not replace an owner that was explicitly chosen.
 */
export function pickDefaultCrmOwner<T extends CrmOwnerCandidate>(users: T[]): T | null {
  const active = users.filter((user) => user.is_active);
  const humans = active.filter((user) => user.user_type === "human");
  const pool = humans.length > 0 ? humans : active;
  return (
    [...pool].sort(
      (a, b) => Number(b.login_enabled) - Number(a.login_enabled) || a.id - b.id,
    )[0] ?? null
  );
}

/** Keep an explicit owner. Use the fallback only when nothing was selected. */
export function resolveRecordOwner(
  explicit: string | null | undefined,
  fallback: string | null | undefined,
): string | null {
  const chosen = explicit?.trim();
  if (chosen) return chosen;
  const resolved = fallback?.trim();
  return resolved || null;
}
