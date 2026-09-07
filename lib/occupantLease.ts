/** Occupant tenancy helpers for commencement / expiry / term. */

export const LEASE_EXPIRY_WITHIN_MONTHS = ["3", "6", "9", "12", "18", "24"] as const;

export type LeaseExpiryWithinMonths = (typeof LEASE_EXPIRY_WITHIN_MONTHS)[number];

function parseIsoDate(value: string | null | undefined): Date | null {
  const raw = (value ?? "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function monthsBetweenLeaseDates(
  commencement: string | null | undefined,
  expiry: string | null | undefined,
): number | null {
  const start = parseIsoDate(commencement);
  const end = parseIsoDate(expiry);
  if (!start || !end || end < start) return null;
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

/** Human term from two dates, e.g. "3 years" or "18 months". */
export function formatLeaseTermFromDates(
  commencement: string | null | undefined,
  expiry: string | null | undefined,
): string | null {
  const months = monthsBetweenLeaseDates(commencement, expiry);
  if (months == null || months <= 0) return null;
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} year${years === 1 ? "" : "s"}`;
  }
  return `${months} month${months === 1 ? "" : "s"}`;
}

export function formatOccupantTenancySummary(input: {
  lease_commencement?: string | null;
  lease_expiry?: string | null;
  lease_term?: string | null;
}): string | null {
  const start = (input.lease_commencement ?? "").trim().slice(0, 10);
  const end = (input.lease_expiry ?? "").trim().slice(0, 10);
  const term = resolveOccupantLeaseTerm(start || null, end || null, input.lease_term);
  const parts: string[] = [];
  if (start && end) parts.push(`${start} – ${end}`);
  else if (end) parts.push(`Expires ${end}`);
  else if (start) parts.push(`From ${start}`);
  if (term) parts.push(term);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function resolveOccupantLeaseTerm(
  commencement: string | null | undefined,
  expiry: string | null | undefined,
  term: string | null | undefined,
): string | null {
  const explicit = (term ?? "").trim();
  if (explicit) return explicit;
  return formatLeaseTermFromDates(commencement, expiry);
}

/** True when expiry is today or later, and no later than N months from today. */
export function leaseExpiryWithinMonths(
  expiry: string | null | undefined,
  months: number,
): boolean {
  const end = parseIsoDate(expiry);
  if (!end || !Number.isFinite(months) || months <= 0) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (end < today) return false;
  const limit = new Date(today);
  limit.setMonth(limit.getMonth() + months);
  return end <= limit;
}
