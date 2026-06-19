-- Phase 26: Backfill reverse relationship rows for paired Refers / Represents links

INSERT INTO relationships (
  relationship_id,
  from_entity_type,
  from_entity_id,
  to_entity_type,
  to_entity_id,
  relationship_type,
  status,
  start_date,
  end_date,
  remarks,
  created_at,
  updated_at
)
SELECT
  'rel_' || replace(gen_random_uuid()::text, '-', ''),
  r.to_entity_type,
  r.to_entity_id,
  r.from_entity_type,
  r.from_entity_id,
  CASE r.relationship_type
    WHEN 'Refers' THEN 'Referred By'
    WHEN 'Represents' THEN 'Represented By'
  END,
  r.status,
  r.start_date,
  r.end_date,
  NULL,
  NOW(),
  NOW()
FROM relationships r
WHERE r.relationship_type IN ('Refers', 'Represents')
  AND NOT EXISTS (
    SELECT 1
    FROM relationships x
    WHERE x.from_entity_type = r.to_entity_type
      AND x.from_entity_id = r.to_entity_id
      AND x.to_entity_type = r.from_entity_type
      AND x.to_entity_id = r.from_entity_id
      AND x.relationship_type = CASE r.relationship_type
        WHEN 'Refers' THEN 'Referred By'
        WHEN 'Represents' THEN 'Represented By'
      END
  );
