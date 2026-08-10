ALTER TABLE properties_v1
  ADD COLUMN IF NOT EXISTS building_relationship_lines JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE properties_v1 p
SET building_relationship_lines = relationships.lines
FROM (
  SELECT property_id, jsonb_agg(line) AS lines
  FROM (
    SELECT property_id, jsonb_build_object('role', 'Owner', 'company_id', owner_company_id, 'remarks', '') AS line FROM properties_v1 WHERE owner_company_id IS NOT NULL
    UNION ALL
    SELECT property_id, jsonb_build_object('role', 'Management Office', 'company_id', management_company_id, 'remarks', '') FROM properties_v1 WHERE management_company_id IS NOT NULL
    UNION ALL
    SELECT property_id, jsonb_build_object('role', 'Occupant', 'company_id', current_tenant_company_id, 'remarks', '') FROM properties_v1 WHERE current_tenant_company_id IS NOT NULL
  ) seeded
  GROUP BY property_id
) relationships
WHERE p.property_id = relationships.property_id
  AND p.building_relationship_lines = '[]'::jsonb;
