import { query } from "@/lib/db";

export type EmailConfig = {
  mailbox_name: string;
  email_address: string | null;
  imap_host: string | null;
  imap_port: number;
  imap_username: string | null;
  imap_tls: boolean;
  inbox_folder: string;
  sent_folder: string;
  smtp_host: string | null;
  smtp_port: number;
  smtp_tls: boolean;
  default_lead_owner: string | null;
  default_virtual_staff: string | null;
  sync_days: number;
  sync_enabled: boolean;
  draft_only: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_error: string | null;
};

export async function getEmailConfig(): Promise<EmailConfig> {
  const rows = await query<EmailConfig>(`SELECT mailbox_name, email_address, imap_host, imap_port, imap_username, imap_tls,
    inbox_folder, sent_folder, smtp_host, smtp_port, smtp_tls, default_lead_owner, default_virtual_staff,
    sync_days, sync_enabled, draft_only, last_sync_at::text, last_sync_status, last_error
    FROM email_mailbox_config WHERE id=1`);
  return rows[0]!;
}

export async function saveEmailConfig(config: Omit<EmailConfig, "last_sync_at" | "last_sync_status" | "last_error">): Promise<void> {
  await query(`UPDATE email_mailbox_config SET mailbox_name=$1, email_address=$2, imap_host=$3, imap_port=$4,
    imap_username=$5, imap_tls=$6, inbox_folder=$7, sent_folder=$8, smtp_host=$9, smtp_port=$10,
    smtp_tls=$11, default_lead_owner=$12, default_virtual_staff=$13, sync_days=$14,
    sync_enabled=$15, draft_only=$16, updated_at=NOW() WHERE id=1`,
    [config.mailbox_name, config.email_address, config.imap_host, config.imap_port, config.imap_username,
      config.imap_tls, config.inbox_folder, config.sent_folder, config.smtp_host, config.smtp_port,
      config.smtp_tls, config.default_lead_owner, config.default_virtual_staff, config.sync_days,
      config.sync_enabled, config.draft_only]);
}

