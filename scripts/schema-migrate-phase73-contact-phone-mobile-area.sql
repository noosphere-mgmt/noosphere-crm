-- Phase 73: Contact phone/mobile split + dialing area codes
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone_area_code TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mobile_area_code TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS whatsapp_area_code TEXT;

-- Existing `phone` was labeled Mobile in the UI — preserve it as mobile.
UPDATE contacts
SET mobile = phone,
    phone = NULL
WHERE (mobile IS NULL OR btrim(mobile) = '')
  AND phone IS NOT NULL
  AND btrim(phone) <> '';
