/**
 * Canonical lead field labels / presence for CSV template + create/edit UI.
 * Keep import adapter FIELD_KEYS order and LeadForm labels in sync with this list.
 */

export const LEAD_FIELD_LABELS = {
  lead_id: "Lead ID",
  status: "Status",
  source: "Lead Source",
  contact_name: "Contact Name",
  company_name: "Company Name",
  email: "Email",
  phone: "Phone",
  website: "Website",
  email_subject: "Email Subject",
  email_message_id: "Email Message ID",
  email_thread_id: "Email Thread ID",
  office_space_required: "Requires Office Space?",
  next_lease_expiry: "Next Lease Expiry",
  location: "Location",
  property_category_preference: "Required Type",
  property_type_preference: "Required Subtype",
  required_area_sqft: "Area (Sq Ft)",
  required_capacity_pax: "Capacity",
  next_follow_up_date: "Next Follow-Up",
  email_excerpt: "Email Excerpt",
  requirement_notes: "Requirement Notes",
  ai_digest: "AI Digest",
  qualification_reason: "Qualification Reason",
  assigned_owner: "Lead Owner",
  virtual_staff: "Virtual Staff",
  qualification_score: "Qualification Score",
  last_email_at: "Last Email",
  converted_company_id: "Converted Company ID",
  converted_contact_id: "Converted Contact ID",
  converted_opportunity_id: "Converted Opportunity ID",
  converted_at: "Converted At",
} as const;

export type LeadFieldKey = keyof typeof LEAD_FIELD_LABELS;

/** CSV / form-facing keys in create·edit display order (template excludes exportHidden). */
export const LEAD_FORM_FIELD_KEYS = [
  "status",
  "source",
  "contact_name",
  "company_name",
  "email",
  "phone",
  "website",
  "email_subject",
  "email_message_id",
  "email_thread_id",
  "office_space_required",
  "next_lease_expiry",
  "location",
  "property_category_preference",
  "property_type_preference",
  "required_area_sqft",
  "required_capacity_pax",
  "next_follow_up_date",
  "email_excerpt",
  "requirement_notes",
  "ai_digest",
  "qualification_reason",
  "assigned_owner",
  "virtual_staff",
  "qualification_score",
  "last_email_at",
] as const satisfies readonly LeadFieldKey[];

/** Full import/export key order (match id first; conversion system fields last / hidden). */
export const LEAD_CSV_FIELD_KEYS = [
  "lead_id",
  ...LEAD_FORM_FIELD_KEYS,
  "converted_company_id",
  "converted_contact_id",
  "converted_opportunity_id",
  "converted_at",
] as const satisfies readonly LeadFieldKey[];

export const LEAD_EXPORT_HIDDEN_KEYS = new Set<LeadFieldKey>([
  "converted_company_id",
  "converted_contact_id",
  "converted_opportunity_id",
  "converted_at",
]);

export function leadFieldLabel(key: LeadFieldKey): string {
  return LEAD_FIELD_LABELS[key];
}
