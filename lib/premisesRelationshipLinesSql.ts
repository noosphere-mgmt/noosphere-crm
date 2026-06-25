/** SQL helpers for premises_v1.relationship_lines (TEXT or JSONB). */

/** Coerce a relationship_lines cell value to jsonb for type checks/updates. */
export const SQL_RELATIONSHIP_LINES_AS_JSONB = `(
  CASE pg_typeof(relationship_lines)::text
    WHEN 'text' THEN
      CASE
        WHEN relationship_lines IS NULL OR btrim(relationship_lines::text) = '' THEN '[]'::jsonb
        WHEN btrim(relationship_lines::text) = '[]' THEN '[]'::jsonb
        WHEN left(btrim(relationship_lines::text), 1) IN ('[', '"', '{') THEN
          COALESCE(
            CASE jsonb_typeof(btrim(relationship_lines::text)::jsonb)
              WHEN 'string' THEN
                COALESCE((btrim(relationship_lines::text)::jsonb #>> '{}')::jsonb, '[]'::jsonb)
              WHEN 'array' THEN btrim(relationship_lines::text)::jsonb
              ELSE '[]'::jsonb
            END,
            '[]'::jsonb
          )
        ELSE '[]'::jsonb
      END
    ELSE relationship_lines::jsonb
  END
)`;

export const SQL_ENSURE_RELATIONSHIP_LINES_JSONB_COLUMN = `
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
END $$;
`;

export const SQL_NORMALIZE_RELATIONSHIP_LINES_JSONB = `
UPDATE premises_v1
SET relationship_lines = CASE
  WHEN jsonb_typeof(relationship_lines) = 'string' THEN
    COALESCE((relationship_lines #>> '{}')::jsonb, '[]'::jsonb)
  WHEN jsonb_typeof(relationship_lines) = 'array' THEN relationship_lines
  ELSE '[]'::jsonb
END
WHERE relationship_lines IS NOT NULL
  AND jsonb_typeof(relationship_lines) IS DISTINCT FROM 'array'
`;
