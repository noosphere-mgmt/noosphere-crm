CREATE OR REPLACE FUNCTION generated_premises_name_en(
  building_name TEXT,
  floor_value TEXT,
  unit_value TEXT
) RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT NULLIF(trim(concat_ws(' - ',
    NULLIF(trim(building_name), ''),
    CASE WHEN NULLIF(trim(floor_value), '') IS NOT NULL THEN
      CASE WHEN trim(floor_value) ~* '/f$' THEN trim(floor_value)
           ELSE trim(floor_value) || '/F' END
    END,
    CASE WHEN NULLIF(trim(unit_value), '') IS NOT NULL THEN
      '#' || trim(regexp_replace(unit_value, '^#+', ''))
    END
  )), '');
$$;

CREATE OR REPLACE FUNCTION sync_premises_name_en()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  building_name TEXT;
BEGIN
  SELECT bldg_name_en INTO building_name
  FROM properties_v1
  WHERE property_id = NEW.property_id;

  NEW.property_name_en := generated_premises_name_en(building_name, NEW.floor, NEW.unit);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS premises_v1_sync_name_en ON premises_v1;
CREATE TRIGGER premises_v1_sync_name_en
BEFORE INSERT OR UPDATE OF property_id, floor, unit ON premises_v1
FOR EACH ROW EXECUTE FUNCTION sync_premises_name_en();

CREATE OR REPLACE FUNCTION sync_building_premises_names_en()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE premises_v1
  SET property_name_en = generated_premises_name_en(NEW.bldg_name_en, floor, unit)
  WHERE property_id = NEW.property_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_v1_sync_premises_names_en ON properties_v1;
CREATE TRIGGER properties_v1_sync_premises_names_en
AFTER UPDATE OF bldg_name_en ON properties_v1
FOR EACH ROW
WHEN (OLD.bldg_name_en IS DISTINCT FROM NEW.bldg_name_en)
EXECUTE FUNCTION sync_building_premises_names_en();

UPDATE premises_v1 p
SET property_name_en = generated_premises_name_en(b.bldg_name_en, p.floor, p.unit)
FROM properties_v1 b
WHERE b.property_id = p.property_id;

