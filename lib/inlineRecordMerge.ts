import type { CompanyInput } from "@/lib/repos/companies";
import type { ContactInput } from "@/lib/repos/contacts";
import type { OpportunityInput } from "@/lib/repos/opportunities";
import { syncContactDerivedNames } from "@/lib/contactName";
import { parseOpportunityFundingStatus, parseOpportunityStatus } from "@/lib/opportunityFormParsing";
import { OPPORTUNITY_LEAD_TYPES } from "@/lib/lookups";
import type {
  Company,
  CompanyRole,
  Contact,
  Opportunity,
  OpportunityLeadType,
  OpportunitySalesRole,
  RelationshipStrength,
} from "@/lib/types/entities";
import { OPPORTUNITY_SALES_ROLES } from "@/lib/opportunityValues";

function normalizeCompanyRoles(roles: CompanyRole[]): CompanyRole[] {
  return roles.map((role) => {
    if (role === "property_management") return "building_management";
    if (role === "developer" || role === "service_provider") return "other";
    return role;
  });
}

export function companyToInput(company: Company): CompanyInput {
  return {
    company_name: company.company_name,
    company_name_zh: company.company_name_zh,
    company_name_cn: company.company_name_cn,
    roles: normalizeCompanyRoles(company.roles?.length ? company.roles : ["client"]),
    coverage: company.coverage ?? [],
    country: company.country ?? "Hong Kong",
    city: company.city ?? "Hong Kong",
    district: company.district,
    website: company.website,
    phone: company.phone,
    email: company.email,
    industry: company.industry,
    source: company.source,
    relationship_owner: company.relationship_owner,
    last_contact_date: company.last_contact_date,
    last_meeting_date: company.last_meeting_date,
    next_follow_up_date: company.next_follow_up_date,
    relationship_strength: company.relationship_strength,
    notes: company.notes,
    is_active: company.is_active,
  };
}

export function contactToInput(contact: Contact): ContactInput {
  return {
    company_id: contact.company_id,
    first_name: contact.first_name,
    last_name: contact.last_name,
    chinese_name: contact.chinese_name,
    display_name: contact.display_name,
    contact_name: contact.contact_name,
    title: contact.title,
    email: contact.email,
    phone: contact.phone,
    whatsapp: contact.whatsapp,
    wechat: contact.wechat,
    preferred_language: contact.preferred_language,
    contact_role: contact.contact_role ?? [],
    coverage: contact.coverage ?? [],
    is_primary: contact.is_primary,
    last_contact_date: contact.last_contact_date,
    next_follow_up_date: contact.next_follow_up_date,
    notes: contact.notes,
    is_active: contact.is_active,
  };
}

export function applyCompanyPatch(
  company: Company,
  field: string,
  value: unknown,
): CompanyInput | { error: string } {
  const input = companyToInput(company);
  switch (field) {
    case "company_name":
      input.company_name = String(value ?? "").trim();
      if (!input.company_name) return { error: "Company name is required" };
      break;
    case "company_name_zh":
      input.company_name_zh = value ? String(value).trim() || null : null;
      break;
    case "company_name_cn":
      input.company_name_cn = value ? String(value).trim() || null : null;
      break;
    case "country":
      input.country = String(value ?? "").trim() || "Hong Kong";
      break;
    case "city":
      input.city = String(value ?? "").trim() || "Hong Kong";
      break;
    case "district":
      input.district = value ? String(value).trim() || null : null;
      break;
    case "roles":
      input.roles = Array.isArray(value) ? (value as CompanyRole[]) : input.roles;
      break;
    case "coverage":
      input.coverage = Array.isArray(value) ? value.map(String) : [];
      break;
    case "website":
    case "phone":
    case "email":
    case "industry":
    case "source":
    case "relationship_owner":
    case "notes":
      input[field] = value ? String(value).trim() || null : null;
      break;
    case "next_follow_up_date":
    case "last_meeting_date":
      input[field] = value ? String(value).trim() || null : null;
      break;
    case "relationship_strength": {
      const v = value ? String(value).trim() : "";
      input.relationship_strength = ["cold", "warm", "active", "strategic"].includes(v)
        ? (v as RelationshipStrength)
        : null;
      break;
    }
    case "is_active":
      input.is_active = Boolean(value);
      break;
    default:
      return { error: `Unknown field: ${field}` };
  }
  return input;
}

export function applyContactPatch(
  contact: Contact,
  field: string,
  value: unknown,
): ContactInput | { error: string } {
  const input = contactToInput(contact);
  switch (field) {
    case "company_id": {
      const id = Number(value);
      if (!Number.isFinite(id) || id <= 0) return { error: "Company is required" };
      input.company_id = id;
      break;
    }
    case "first_name":
    case "last_name":
    case "chinese_name":
    case "title":
    case "email":
    case "phone":
    case "whatsapp":
    case "wechat":
    case "preferred_language":
    case "notes":
      input[field] = value ? String(value).trim() || null : null;
      break;
    case "coverage":
      input.coverage = Array.isArray(value) ? value.map(String) : [];
      break;
    case "contact_role":
      input.contact_role = Array.isArray(value) ? (value.map(String) as CompanyRole[]) : [];
      break;
    case "next_follow_up_date":
      input.next_follow_up_date = value ? String(value).trim() || null : null;
      break;
    case "is_primary":
    case "is_active":
      input[field] = Boolean(value);
      break;
    default:
      return { error: `Unknown field: ${field}` };
  }
  return syncContactDerivedNames(input);
}

function parseOptionalNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function parseOptionalInt(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

export function opportunityToInput(opportunity: Opportunity): OpportunityInput {
  return {
    client_name: opportunity.client_name,
    lead_type: opportunity.lead_type,
    company_name: opportunity.company_name ?? opportunity.linked_company_name ?? null,
    company_id: opportunity.company_id,
    primary_contact_id: opportunity.primary_contact_id,
    referrer_company_id: opportunity.referrer_company_id,
    referrer_contact_id: opportunity.referrer_contact_id,
    sales_role: opportunity.sales_role ?? "to_lease",
    lease_term: opportunity.lease_term,
    expected_close_date: opportunity.expected_close_date,
    lost_reason: opportunity.lost_reason,
    relationship_owner: opportunity.relationship_owner,
    budget_min: parseOptionalNumber(opportunity.budget_min),
    budget_max: parseOptionalNumber(opportunity.budget_max),
    required_area_sqft: parseOptionalNumber(opportunity.required_area_sqft),
    required_capacity_pax: opportunity.required_capacity_pax,
    district_preference: opportunity.district_preference,
    workspace_type: opportunity.workspace_type ?? opportunity.property_type,
    property_type: opportunity.property_type ?? opportunity.workspace_type,
    target_yield: opportunity.target_yield,
    funding_status: opportunity.funding_status as OpportunityInput["funding_status"],
    move_in_date: opportunity.move_in_date,
    status: opportunity.status,
    requirement_summary: opportunity.requirement_summary,
    remarks: opportunity.remarks,
  };
}

export function applyOpportunityPatch(
  opportunity: Opportunity,
  field: string,
  value: unknown,
): OpportunityInput | { error: string } {
  const input = opportunityToInput(opportunity);
  switch (field) {
    case "client_name": {
      const name = String(value ?? "").trim();
      if (!name) return { error: "Opportunity name is required" };
      input.client_name = name;
      break;
    }
    case "status":
      input.status = parseOpportunityStatus(String(value ?? "new"));
      break;
    case "lead_type": {
      const lead = String(value ?? "").trim();
      input.lead_type = (OPPORTUNITY_LEAD_TYPES as readonly string[]).includes(lead)
        ? (lead as OpportunityLeadType)
        : input.lead_type;
      break;
    }
    case "company_id": {
      const id = parseOptionalInt(value);
      input.company_id = id;
      break;
    }
    case "company_name":
      input.company_name = value ? String(value).trim() || null : null;
      break;
    case "primary_contact_id":
      input.primary_contact_id = parseOptionalInt(value);
      break;
    case "budget_max":
      input.budget_max = parseOptionalNumber(value);
      break;
    case "required_area_sqft":
      input.required_area_sqft = parseOptionalNumber(value);
      break;
    case "district_preference":
    case "move_in_date":
    case "requirement_summary":
    case "remarks":
    case "lease_term":
    case "expected_close_date":
    case "relationship_owner":
    case "lost_reason":
    case "target_yield":
      input[field] = value ? String(value).trim() || null : null;
      break;
    case "property_type":
    case "workspace_type": {
      const pt = value ? String(value).trim() || null : null;
      input.property_type = pt;
      input.workspace_type = pt;
      break;
    }
    case "required_capacity_pax":
      input.required_capacity_pax = parseOptionalInt(value);
      break;
    case "funding_status":
      input.funding_status = value
        ? parseOpportunityFundingStatus(String(value))
        : null;
      break;
    case "sales_role": {
      const role = String(value ?? "").trim();
      input.sales_role = (OPPORTUNITY_SALES_ROLES as readonly string[]).includes(role)
        ? (role as OpportunitySalesRole)
        : input.sales_role;
      break;
    }
    default:
      return { error: `Unknown field: ${field}` };
  }
  return input;
}
