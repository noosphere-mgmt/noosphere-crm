-- Phase 37: Contact locate_at field

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS locate_at TEXT NULL;
