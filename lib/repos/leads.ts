import { query } from "@/lib/db";

export type LeadStatus = "new" | "reviewing" | "qualified" | "converted" | "nurture" | "disqualified" | "duplicate";

export type Lead = {
  id: number;
  status: LeadStatus;
  contact_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  source: string;
  email_subject: string | null;
  email_excerpt: string | null;
  email_message_id: string | null;
  email_thread_id: string | null;
  requirement_notes: string | null;
  ai_digest: string | null;
  office_space_required: boolean | null;
  next_lease_expiry: string | null;
  required_area_sqft: string | null;
  required_capacity_pax: number | null;
  preferred_location: string | null;
  assigned_owner: string | null;
  virtual_staff: string | null;
  qualification_score: number | null;
  qualification_reason: string | null;
  last_email_at: string | null;
  next_follow_up_date: string | null;
  converted_company_id: number | null;
  converted_contact_id: number | null;
  converted_opportunity_id: number | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadInput = Omit<Lead, "id" | "converted_company_id" | "converted_contact_id" | "converted_opportunity_id" | "converted_at" | "created_at" | "updated_at">;

const leadSelect = `
  id, status, contact_name, company_name, email, phone, website, source,
  email_subject, email_excerpt, email_message_id, email_thread_id,
  requirement_notes, ai_digest, office_space_required, next_lease_expiry::text,
  required_area_sqft::text, required_capacity_pax, preferred_location,
  assigned_owner, virtual_staff, qualification_score, qualification_reason,
  last_email_at::text, next_follow_up_date::text,
  converted_company_id, converted_contact_id, converted_opportunity_id, converted_at::text,
  created_at::text, updated_at::text
`;

function values(input: LeadInput) {
  return [
    input.status, input.contact_name, input.company_name, input.email, input.phone, input.website,
    input.source, input.email_subject, input.email_excerpt, input.email_message_id, input.email_thread_id,
    input.requirement_notes, input.ai_digest, input.office_space_required, input.next_lease_expiry,
    input.required_area_sqft, input.required_capacity_pax, input.preferred_location,
    input.assigned_owner, input.virtual_staff, input.qualification_score, input.qualification_reason,
    input.last_email_at, input.next_follow_up_date,
  ];
}

export async function listLeads(): Promise<Lead[]> {
  return query<Lead>(`SELECT ${leadSelect} FROM leads ORDER BY updated_at DESC, id DESC`);
}

export async function getLead(id: number): Promise<Lead | null> {
  const rows = await query<Lead>(`SELECT ${leadSelect} FROM leads WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function createLead(input: LeadInput): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO leads (
      status, contact_name, company_name, email, phone, website, source,
      email_subject, email_excerpt, email_message_id, email_thread_id,
      requirement_notes, ai_digest, office_space_required, next_lease_expiry,
      required_area_sqft, required_capacity_pax, preferred_location,
      assigned_owner, virtual_staff, qualification_score, qualification_reason,
      last_email_at, next_follow_up_date
    ) VALUES (${Array.from({ length: 24 }, (_, i) => `$${i + 1}`).join(", ")}) RETURNING id::text AS id`,
    values(input),
  );
  return Number.parseInt(rows[0]!.id, 10);
}

export async function updateLead(id: number, input: LeadInput): Promise<void> {
  await query(
    `UPDATE leads SET
      status=$2, contact_name=$3, company_name=$4, email=$5, phone=$6, website=$7, source=$8,
      email_subject=$9, email_excerpt=$10, email_message_id=$11, email_thread_id=$12,
      requirement_notes=$13, ai_digest=$14, office_space_required=$15, next_lease_expiry=$16,
      required_area_sqft=$17, required_capacity_pax=$18, preferred_location=$19,
      assigned_owner=$20, virtual_staff=$21, qualification_score=$22, qualification_reason=$23,
      last_email_at=$24, next_follow_up_date=$25, updated_at=NOW()
     WHERE id=$1`,
    [id, ...values(input)],
  );
}

export async function markLeadConverted(id: number, companyId: number, contactId: number, opportunityId: number): Promise<void> {
  await query(
    `UPDATE leads SET status='converted', converted_company_id=$2, converted_contact_id=$3,
       converted_opportunity_id=$4, converted_at=NOW(), updated_at=NOW() WHERE id=$1`,
    [id, companyId, contactId, opportunityId],
  );
}

