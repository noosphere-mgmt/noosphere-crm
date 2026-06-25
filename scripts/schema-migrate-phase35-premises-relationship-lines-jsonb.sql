-- Phase 35: Normalize premises_v1.relationship_lines to a JSONB array.
-- Idempotent: handles TEXT/VARCHAR columns (production) and JSONB string scalars (e.g. "[]").

DO $$
DECLARE
  col_udt text;
BEGIN
  SELECT udt_name INTO col_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'premises_v1'
    AND column_name = 'relationship_lines';

  IF col_udt IS NULL THEN
    RAISE NOTICE 'premises_v1.relationship_lines missing — skipping phase 35';
    RETURN;
  END IF;

  IF col_udt IN ('text', 'varchar', 'character varying') THEN
    ALTER TABLE premises_v1
      ALTER COLUMN relationship_lines TYPE jsonb
      USING (
        CASE
          WHEN relationship_lines IS NULL OR btrim(relationship_lines) = '' THEN '[]'::jsonb
          WHEN btrim(relationship_lines) = '[]' THEN '[]'::jsonb
          WHEN left(btrim(relationship_lines), 1) IN ('[', '"', '{') THEN
            COALESCE(
              CASE jsonb_typeof(btrim(relationship_lines)::jsonb)
                WHEN 'string' THEN
                  COALESCE((btrim(relationship_lines)::jsonb #>> '{}')::jsonb, '[]'::jsonb)
                WHEN 'array' THEN btrim(relationship_lines)::jsonb
                ELSE '[]'::jsonb
              END,
              '[]'::jsonb
            )
          ELSE '[]'::jsonb
        END
      );
  END IF;

  UPDATE premises_v1
  SET relationship_lines = CASE
    WHEN jsonb_typeof(relationship_lines) = 'string' THEN
      COALESCE((relationship_lines #>> '{}')::jsonb, '[]'::jsonb)
    WHEN jsonb_typeof(relationship_lines) = 'array' THEN relationship_lines
    ELSE '[]'::jsonb
  END
  WHERE relationship_lines IS NOT NULL
    AND jsonb_typeof(relationship_lines) IS DISTINCT FROM 'array';
END $$;
