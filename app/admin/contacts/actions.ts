"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createContact,
  deleteContact,
  bulkDeleteContacts,
  getContact,
  updateContact,
} from "@/lib/repos/contacts";
import {
  addContactRelationship,
  isContactRelationshipType,
  removeContactRelationship,
} from "@/lib/repos/contactRelationships";

import { resolveContactName } from "@/lib/contactName";
import { applyContactPatch } from "@/lib/inlineRecordMerge";
import { COMPANY_ROLES } from "@/lib/lookups";
import type { CompanyRole } from "@/lib/types/entities";
import type { PatchResult } from "@/lib/types/inlineEdit";

function parseOptionalString(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function parseOptionalId(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function contactInputFromForm(formData: FormData) {
  const companyId = parseOptionalId(formData.get("company_id"));
  if (!companyId) throw new Error("Company is required");
  const contactRole = formData
    .getAll("contact_role")
    .map(String)
    .filter((r): r is CompanyRole => (COMPANY_ROLES as readonly string[]).includes(r));
  const input = {
    company_id: companyId,
    first_name: parseOptionalString(formData.get("first_name")),
    last_name: parseOptionalString(formData.get("last_name")),
    chinese_name: parseOptionalString(formData.get("chinese_name")),
    display_name: parseOptionalString(formData.get("display_name")),
    title: parseOptionalString(formData.get("title")),
    email: parseOptionalString(formData.get("email")),
    phone: parseOptionalString(formData.get("phone")),
    whatsapp: parseOptionalString(formData.get("whatsapp")),
    wechat: parseOptionalString(formData.get("wechat")),
    preferred_language: parseOptionalString(formData.get("preferred_language")),
    contact_role: contactRole,
    coverage: formData.getAll("coverage").map(String).filter(Boolean),
    is_primary: formData.get("is_primary") === "on",
    last_contact_date: parseOptionalString(formData.get("last_contact_date")),
    next_follow_up_date: parseOptionalString(formData.get("next_follow_up_date")),
    notes: parseOptionalString(formData.get("notes")),
    is_active: formData.get("is_active") === "on",
  };
  if (!resolveContactName(input)) throw new Error("Display name is required");
  return input;
}

function revalidateContactPaths(companyId: number) {
  revalidatePath("/admin/contacts");
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/opportunities");
}

export async function createContactAction(formData: FormData) {
  const input = contactInputFromForm(formData);
  const id = await createContact(input);
  revalidateContactPaths(input.company_id);
  const returnTo = parseOptionalString(formData.get("return_to"));
  redirect(returnTo ?? `/admin/contacts/${id}`);
}

export async function updateContactAction(id: number, formData: FormData) {
  const input = contactInputFromForm(formData);
  await updateContact(id, input);
  revalidateContactPaths(input.company_id);
  redirect(`/admin/contacts/${id}`);
}

export async function deleteContactAction(id: number) {
  const contact = await getContact(id);
  await deleteContact(id);
  if (contact) revalidateContactPaths(contact.company_id);
  redirect("/admin/contacts");
}

export async function bulkDeleteContactsAction(formData: FormData) {
  const ids = String(formData.get("contact_ids") ?? "")
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (ids.length === 0) return;
  await bulkDeleteContacts(ids);
  revalidatePath("/admin/contacts");
  redirect("/admin/contacts");
}

export async function patchContactFieldAction(
  id: number,
  field: string,
  valueJson: string,
): Promise<PatchResult> {
  try {
    const contact = await getContact(id);
    if (!contact) return { ok: false, error: "Contact not found" };

    let value: unknown;
    try {
      value = JSON.parse(valueJson);
    } catch {
      return { ok: false, error: "Invalid value" };
    }

    const merged = applyContactPatch(contact, field, value);
    if ("error" in merged) return { ok: false, error: merged.error };
    if (!resolveContactName(merged)) {
      return { ok: false, error: "Display name is required" };
    }

    const prevCompanyId = contact.company_id;
    await updateContact(id, merged);
    revalidateContactPaths(merged.company_id);
    if (merged.company_id !== prevCompanyId) {
      revalidatePath(`/admin/companies/${prevCompanyId}`);
    }
    revalidatePath(`/admin/contacts/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed" };
  }
}

export async function addContactRelationshipAction(
  contactId: number,
  relatedCompanyId: number,
  relationshipType: string,
): Promise<PatchResult> {
  try {
    if (!isContactRelationshipType(relationshipType)) {
      return { ok: false, error: "Invalid relationship type" };
    }
    const contact = await getContact(contactId);
    if (!contact) return { ok: false, error: "Contact not found" };
    await addContactRelationship(contactId, relatedCompanyId, relationshipType);
    revalidateContactPaths(contact.company_id);
    revalidatePath("/admin/contacts");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not add relationship" };
  }
}

export async function removeContactRelationshipAction(
  relationshipId: number,
  contactId: number,
): Promise<void> {
  const contact = await getContact(contactId);
  await removeContactRelationship(relationshipId, contactId);
  if (contact) revalidateContactPaths(contact.company_id);
  revalidatePath("/admin/contacts");
}
