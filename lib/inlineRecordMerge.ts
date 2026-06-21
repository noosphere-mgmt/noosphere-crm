import type { CompanyInput } from "@/lib/repos/companies";
import type { ContactInput } from "@/lib/repos/contacts";
import { syncContactDerivedNames } from "@/lib/contactName";
import type { Company, CompanyRole, Contact, RelationshipStrength } from "@/lib/types/entities";

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
