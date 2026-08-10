CREATE TABLE IF NOT EXISTS email_mailbox_config (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  mailbox_name TEXT NOT NULL DEFAULT 'Lead mailbox',
  email_address TEXT,
  imap_host TEXT,
  imap_port INTEGER NOT NULL DEFAULT 993,
  imap_username TEXT,
  imap_tls BOOLEAN NOT NULL DEFAULT TRUE,
  inbox_folder TEXT NOT NULL DEFAULT 'INBOX',
  sent_folder TEXT NOT NULL DEFAULT 'Sent',
  smtp_host TEXT,
  smtp_port INTEGER NOT NULL DEFAULT 465,
  smtp_tls BOOLEAN NOT NULL DEFAULT TRUE,
  default_lead_owner TEXT,
  default_virtual_staff TEXT,
  sync_days INTEGER NOT NULL DEFAULT 30,
  sync_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  draft_only BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO email_mailbox_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

