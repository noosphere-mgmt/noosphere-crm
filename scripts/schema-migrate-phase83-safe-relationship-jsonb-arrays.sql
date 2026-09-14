-- Phase 83: relationship JSONB columns must be arrays.
-- Search uses jsonb_array_elements; object values such as {} crash Properties search.

UPDATE properties_v1
SET building_relationship_lines = '[]'::jsonb
WHERE jsonb_typeof(COALESCE(building_relationship_lines, '[]'::jsonb)) IS DISTINCT FROM 'array';

UPDATE premises_v1
SET relationship_lines = '[]'::jsonb
WHERE relationship_lines IS NOT NULL
  AND jsonb_typeof(relationship_lines) IS DISTINCT FROM 'array';
