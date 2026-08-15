"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCompany, getCompany } from "@/lib/repos/companies";
import { createContact, getContact } from "@/lib/repos/contacts";
import { createOpportunity } from "@/lib/repos/opportunities";
import { createLead, getLead, markLeadConverted, updateLead, type LeadInput, type LeadStatus } from "@/lib/repos/leads";
import { normalizeLeadSource } from "@/lib/leadValues";
import { normalizeOpportunitySalesRole } from "@/lib/opportunityValues";
import {
  normalizeCategoryPreference,
  normalizeSpaceFormPreference,
} from "@/lib/opportunityPreferences";
import { getDefaultCrmOwnerName } from "@/lib/repos/crmUsers";

const STATUSES = new Set<LeadStatus>(["new", "reviewing", "qualified", "converted", "nurture", "disqualified", "duplicate"]);

function text(formData: FormData, name: string): string | null {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

function integer(formData: FormData, name: string): number | null {
  const value = text(formData, name);
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function decimal(formData: FormData, name: string): string | null {
  const value = text(formData, name);
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? String(parsed) : null;
}

function booleanOrNull(formData: FormData, name: string): boolean | null {
  const value = text(formData, name);
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

function leadInput(formData: FormData): LeadInput {
  const rawStatus = text(formData, "status") as LeadStatus | null;
  return {
    status: rawStatus && STATUSES.has(rawStatus) ? rawStatus : "new",
    contact_name: text(formData, "contact_name"),
    company_name: text(formData, "company_name"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    website: text(formData, "website"),
    source: normalizeLeadSource(text(formData, "source")),
    email_subject: text(formData, "email_subject"),
    email_excerpt: text(formData, "email_excerpt"),
    email_message_id: text(formData, "email_message_id"),
    email_thread_id: text(formData, "email_thread_id"),
    requirement_notes: text(formData, "requirement_notes"),
    ai_digest: text(formData, "ai_digest"),
    office_space_required: booleanOrNull(formData, "office_space_required"),
    next_lease_expiry: text(formData, "next_lease_expiry"),
    required_area_sqft: decimal(formData, "required_area_sqft"),
    required_capacity_pax: integer(formData, "required_capacity_pax"),
    preferred_location: text(formData, "preferred_location"),
    property_category_preference: normalizeCategoryPreference(
      formData.get("property_category_preference"),
    ),
    property_type_preference: normalizeSpaceFormPreference(
      formData.get("property_type_preference"),
    ),
    assigned_owner: text(formData, "assigned_owner"),
    virtual_staff: text(formData, "virtual_staff"),
    qualification_score: integer(formData, "qualification_score"),
    qualification_reason: text(formData, "qualification_reason"),
    last_email_at: text(formData, "last_email_at"),
    next_follow_up_date: text(formData, "next_follow_up_date"),
  };
}

export async function createLeadAction(formData: FormData) {
  const input = leadInput(formData);
  input.assigned_owner ??= await getDefaultCrmOwnerName();
  const id = await createLead(input);
  revalidatePath("/admin/leads");
  redirect(`/admin/leads?lead=${id}`);
}

export async function updateLeadAction(id: number, formData: FormData) {
  const input = leadInput(formData);
  await updateLead(id, input);
  revalidatePath("/admin/leads");
  redirect(`/admin/leads?lead=${id}`);
}

export async function convertLeadAction(id: number, formData: FormData) {
  const lead = await getLead(id);
  if (!lead) throw new Error("Lead not found");
  if (lead.status !== "qualified") throw new Error("Only a qualified lead can be converted");
  if (lead.converted_opportunity_id) redirect(`/admin/leads?lead=${id}`);

  let companyId = integer(formData, "existing_company_id");
  if (companyId) {
    if (!(await getCompany(companyId))) throw new Error("Selected company was not found");
  } else {
    if (!lead.company_name) throw new Error("Company name is required before conversion");
    companyId = await createCompany({
      company_name: lead.company_name,
      roles: ["prospect"],
      country: "Hong Kong",
      city: "Hong Kong",
      website: lead.website,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      relationship_owner: lead.assigned_owner,
      next_follow_up_date: lead.next_follow_up_date,
      notes: lead.ai_digest ?? lead.requirement_notes,
      is_active: true,
    });
  }

  let contactId = integer(formData, "existing_contact_id");
  if (contactId) {
    const contact = await getContact(contactId);
    if (!contact) throw new Error("Selected contact was not found");
    if (contact.company_id != null && contact.company_id !== companyId) throw new Error("Selected contact belongs to another company");
  } else {
    const contactName = lead.contact_name ?? lead.email?.split("@")[0] ?? "Unknown contact";
    contactId = await createContact({
      company_id: companyId,
      contact_name: contactName,
      display_name: contactName,
      email: lead.email,
      phone: lead.phone,
      contact_role: ["prospect"],
      next_follow_up_date: lead.next_follow_up_date,
      notes: lead.ai_digest ?? lead.requirement_notes,
      is_active: true,
    });
  }

  const officeSummary = [
    lead.ai_digest,
    lead.requirement_notes,
    lead.next_lease_expiry ? `Current lease expiry: ${lead.next_lease_expiry}` : null,
  ].filter(Boolean).join("\n\n");
  const opportunityOwner = text(formData, "opportunity_owner") ?? lead.assigned_owner;
  const digest = lead.ai_digest ?? "";
  const salesRoleMatch = digest.match(/Sales Role:\s*([a-z_]+)/i);
  const requiredTypeMatch = digest.match(/Required Type:\s*([a-z_]+)/i);
  const requiredSubtypeMatch = digest.match(/Required Subtype:\s*([a-z_]+)/i);
  const salesRole = salesRoleMatch
    ? normalizeOpportunitySalesRole(salesRoleMatch[1])
    : lead.office_space_required === false
      ? "others"
      : "to_lease";
  const opportunityId = await createOpportunity({
    client_name: lead.contact_name ?? lead.company_name ?? "Email lead",
    company_name: lead.company_name,
    company_id: companyId,
    primary_contact_id: contactId,
    lead_type: "direct_client",
    sales_role: salesRole,
    lead_source: normalizeLeadSource(lead.source),
    relationship_owner: opportunityOwner,
    required_area_sqft: lead.required_area_sqft ? Number.parseFloat(lead.required_area_sqft) : null,
    required_capacity_pax: lead.required_capacity_pax,
    district_preference: lead.preferred_location,
    property_category_preference:
      lead.property_category_preference ??
      normalizeCategoryPreference(requiredTypeMatch?.[1]),
    property_type_preference:
      lead.property_type_preference ??
      normalizeSpaceFormPreference(requiredSubtypeMatch?.[1]),
    move_in_date: lead.next_lease_expiry,
    status: "qualifying",
    next_action: "Review converted email lead and confirm requirement",
    next_action_date: lead.next_follow_up_date,
    requirement_summary: officeSummary || "Converted from email lead",
    remarks: `Lead #${lead.id} · Source: ${lead.source}${lead.virtual_staff ? ` · Virtual staff: ${lead.virtual_staff}` : ""}`,
  });

  await markLeadConverted(id, companyId, contactId, opportunityId);
  revalidatePath("/admin/leads");
  revalidatePath("/admin/companies");
  revalidatePath("/admin/contacts");
  revalidatePath("/admin/opportunities");
  redirect(`/admin/leads?lead=${id}&converted=1`);
}
