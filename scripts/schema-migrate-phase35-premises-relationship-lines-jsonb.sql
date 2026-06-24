-- Coerce premises_v1.relationship_lines from JSON string scalars (e.g. "[]")
-- or non-array JSON values into a proper JSON array.
UPDATE premises_v1
SET relationship_lines = CASE
  WHEN jsonb_typeof(relationship_lines) = 'string' THEN
    COALESCE((relationship_lines #>> '{}')::jsonb, '[]'::jsonb)
  WHEN jsonb_typeof(relationship_lines) = 'array' THEN relationship_lines
  ELSE '[]'::jsonb
END
WHERE relationship_lines IS NOT NULL
  AND jsonb_typeof(relationship_lines) IS DISTINCT FROM 'array';
