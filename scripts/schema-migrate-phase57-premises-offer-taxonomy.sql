ALTER TABLE premises_v1
  ALTER COLUMN asset_class SET DEFAULT 'commercial',
  ALTER COLUMN asset_scope SET DEFAULT 'unit',
  ALTER COLUMN product_subtype SET DEFAULT 'conventional_office',
  ALTER COLUMN market_mode SET DEFAULT 'lease';
