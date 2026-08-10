"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { saveEmailConfig } from "@/lib/repos/emailConfig";

const val = (f: FormData, n: string) => String(f.get(n) ?? "").trim() || null;
const num = (f: FormData, n: string, fallback: number) => Number.parseInt(String(f.get(n) ?? fallback), 10) || fallback;

export async function saveEmailConfigAction(formData: FormData) {
  await saveEmailConfig({
    mailbox_name: val(formData, "mailbox_name") ?? "Lead mailbox",
    email_address: val(formData, "email_address"), imap_host: val(formData, "imap_host"),
    imap_port: num(formData, "imap_port", 993), imap_username: val(formData, "imap_username"),
    imap_tls: formData.get("imap_tls") === "on", inbox_folder: val(formData, "inbox_folder") ?? "INBOX",
    sent_folder: val(formData, "sent_folder") ?? "Sent", smtp_host: val(formData, "smtp_host"),
    smtp_port: num(formData, "smtp_port", 465), smtp_tls: formData.get("smtp_tls") === "on",
    default_lead_owner: val(formData, "default_lead_owner"), default_virtual_staff: val(formData, "default_virtual_staff"),
    sync_days: num(formData, "sync_days", 30), sync_enabled: formData.get("sync_enabled") === "on",
    draft_only: formData.get("draft_only") === "on",
  });
  revalidatePath("/admin/settings/configuration");
  redirect("/admin/settings/configuration?saved=1");
}

