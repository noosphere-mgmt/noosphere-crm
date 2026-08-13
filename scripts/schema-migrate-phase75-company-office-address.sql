-- Company office address (free-text street / suite line).
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS office_address TEXT NULL;
