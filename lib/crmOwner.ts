export type CrmOwnerCandidate = {
  id: number;
  display_name: string;
  user_type: string;
  login_enabled: boolean;
  is_active: boolean;
};

/** Lookup name for the new-opportunity owner. The stored value is the matched user's display name. */
export const OPPORTUNITY_DEFAULT_OWNER_NAME = "Teresa Cheuk";

function ownerNameKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Find an existing staff record by display name. Prefer an active human.
 * Returns null when nobody matches, so callers do not invent a user or store a bare name.
 */
export function pickCrmOwnerByDisplayName<T extends CrmOwnerCandidate>(
  users: T[],
  displayName: string,
): T | null {
  const target = ownerNameKey(displayName);
  if (!target) return null;
  const matches = users.filter((user) => ownerNameKey(user.display_name) === target);
  const active = matches.filter((user) => user.is_active);
  const pool = active.length > 0 ? active : matches;
  return (
    [...pool].sort(
      (a, b) =>
        Number(b.user_type === "human") - Number(a.user_type === "human") ||
        Number(b.login_enabled) - Number(a.login_enabled) ||
        a.id - b.id,
    )[0] ?? null
  );
}

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
