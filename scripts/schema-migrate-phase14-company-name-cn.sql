-- Phase 14: Simplified Chinese company name (distinct from Traditional ZH)

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS company_name_cn TEXT NULL;
