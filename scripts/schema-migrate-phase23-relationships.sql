-- Phase 23: Entity relationship graph (company / contact)

CREATE TABLE IF NOT EXISTS relationships (
  relationship_id TEXT PRIMARY KEY,
  from_entity_type TEXT NOT NULL,
  from_entity_id TEXT NOT NULL,
  to_entity_type TEXT NOT NULL,
  to_entity_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  start_date DATE NULL,
  end_date DATE NULL,
  remarks TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relationships_from
  ON relationships (from_entity_type, from_entity_id);

CREATE INDEX IF NOT EXISTS idx_relationships_to
  ON relationships (to_entity_type, to_entity_id);

-- Migrate legacy contact_relationships → relationships (store once, contact → company)
INSERT INTO relationships (
  relationship_id,
  from_entity_type,
  from_entity_id,
  to_entity_type,
  to_entity_id,
  relationship_type,
  status,
  remarks,
  created_at,
  updated_at
)
SELECT
  'rel_' || replace(gen_random_uuid()::text, '-', ''),
  'contact',
  r.contact_id::text,
  'company',
  r.related_company_id::text,
  CASE r.relationship_type
    WHEN 'referrer' THEN 'Refers'
    WHEN 'agent' THEN 'Represents'
    ELSE 'Other'
  END,
  'Active',
  r.notes,
  NOW(),
  NOW()
FROM contact_relationships r
WHERE NOT EXISTS (
  SELECT 1 FROM relationships x
  WHERE x.from_entity_type = 'contact'
    AND x.from_entity_id = r.contact_id::text
    AND x.to_entity_type = 'company'
    AND x.to_entity_id = r.related_company_id::text
    AND x.relationship_type = CASE r.relationship_type
      WHEN 'referrer' THEN 'Refers'
      WHEN 'agent' THEN 'Represents'
      ELSE 'Other'
    END
);
