/** Types shown when creating or editing an activity. */
export const ACTIVITY_FORM_TYPES = [
  "Call",
  "WhatsApp",
  "WeChat",
  "Meeting",
  "Site Tour",
  "Note",
] as const;

export type ActivityFormType = (typeof ACTIVITY_FORM_TYPES)[number];

/** Legacy values still stored on older records — kept for validation and filters. */
export const LEGACY_ACTIVITY_TYPES = [
  "Site Inspection",
  "Proposal Sent",
  "Follow-up",
  "Lunch",
  "Coffee",
  "Referral",
  "Introduction",
] as const;

export const ACTIVITY_TYPES = [...ACTIVITY_FORM_TYPES, ...LEGACY_ACTIVITY_TYPES] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const MOBILE_QUICK_ACTIVITY_TYPES = [
  "Call",
  "WhatsApp",
  "WeChat",
  "Meeting",
  "Note",
] as const;

export function isActivityType(value: string): value is ActivityType {
  return (ACTIVITY_TYPES as readonly string[]).includes(value);
}

export function isActivityFormType(value: string): value is ActivityFormType {
  return (ACTIVITY_FORM_TYPES as readonly string[]).includes(value);
}

export type SiteTourCheckpointMode = "split" | "combined";

export function isSiteTourActivityType(value: string): boolean {
  return value === "Site Tour" || value === "Site Inspection";
}
