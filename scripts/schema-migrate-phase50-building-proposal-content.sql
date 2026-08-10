ALTER TABLE properties_v1
  ADD COLUMN IF NOT EXISTS bldg_desc_zh TEXT,
  ADD COLUMN IF NOT EXISTS bldg_desc_cn TEXT,
  ADD COLUMN IF NOT EXISTS location_advantages_en TEXT,
  ADD COLUMN IF NOT EXISTS location_advantages_zh TEXT,
  ADD COLUMN IF NOT EXISTS location_advantages_cn TEXT,
  ADD COLUMN IF NOT EXISTS proposal_highlights_en TEXT,
  ADD COLUMN IF NOT EXISTS proposal_highlights_zh TEXT,
  ADD COLUMN IF NOT EXISTS proposal_highlights_cn TEXT;
