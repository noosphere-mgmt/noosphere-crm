ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS property_name_zh_is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS property_name_cn_is_custom BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION generated_premises_name_zh(building_name TEXT, floor_value TEXT, unit_value TEXT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT NULLIF(trim(concat_ws(' | ', NULLIF(trim(building_name), ''), NULLIF(trim(floor_value), ''), NULLIF(trim(unit_value), ''))), '');
$$;

UPDATE premises_v1 p
SET property_name_zh_is_custom = p.property_name_zh IS NOT NULL
      AND p.property_name_zh IS DISTINCT FROM generated_premises_name_zh(b.bldg_name_zh, p.floor, p.unit),
    property_name_cn_is_custom = p.property_name_cn IS NOT NULL
      AND p.property_name_cn IS DISTINCT FROM generated_premises_name_zh(b.bldg_name_cn, p.floor, p.unit)
FROM properties_v1 b
WHERE b.property_id = p.property_id;

UPDATE premises_v1 p
SET property_name_zh = generated_premises_name_zh(b.bldg_name_zh, p.floor, p.unit)
FROM properties_v1 b
WHERE b.property_id = p.property_id
  AND NOT p.property_name_zh_is_custom;

UPDATE premises_v1 p
SET property_name_cn = generated_premises_name_zh(b.bldg_name_cn, p.floor, p.unit)
FROM properties_v1 b
WHERE b.property_id = p.property_id
  AND NOT p.property_name_cn_is_custom;

CREATE OR REPLACE FUNCTION sync_premises_names_chinese()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  building_zh TEXT;
  building_cn TEXT;
  generated_zh TEXT;
  generated_cn TEXT;
BEGIN
  SELECT bldg_name_zh, bldg_name_cn INTO building_zh, building_cn
  FROM properties_v1 WHERE property_id = NEW.property_id;
  generated_zh := generated_premises_name_zh(building_zh, NEW.floor, NEW.unit);
  generated_cn := generated_premises_name_zh(building_cn, NEW.floor, NEW.unit);

  IF TG_OP = 'INSERT' THEN
    NEW.property_name_zh_is_custom := NEW.property_name_zh IS NOT NULL AND NEW.property_name_zh IS DISTINCT FROM generated_zh;
    NEW.property_name_cn_is_custom := NEW.property_name_cn IS NOT NULL AND NEW.property_name_cn IS DISTINCT FROM generated_cn;
  ELSE
    IF NEW.property_name_zh IS DISTINCT FROM OLD.property_name_zh THEN
      NEW.property_name_zh_is_custom := NEW.property_name_zh IS NOT NULL AND NEW.property_name_zh IS DISTINCT FROM generated_zh;
    END IF;
    IF NEW.property_name_cn IS DISTINCT FROM OLD.property_name_cn THEN
      NEW.property_name_cn_is_custom := NEW.property_name_cn IS NOT NULL AND NEW.property_name_cn IS DISTINCT FROM generated_cn;
    END IF;
  END IF;

  IF NOT NEW.property_name_zh_is_custom THEN NEW.property_name_zh := generated_zh; END IF;
  IF NOT NEW.property_name_cn_is_custom THEN NEW.property_name_cn := generated_cn; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS premises_v1_sync_names_chinese ON premises_v1;
CREATE TRIGGER premises_v1_sync_names_chinese
BEFORE INSERT OR UPDATE OF property_id, floor, unit, property_name_zh, property_name_cn ON premises_v1
FOR EACH ROW EXECUTE FUNCTION sync_premises_names_chinese();

CREATE OR REPLACE FUNCTION sync_building_premises_names_chinese()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE premises_v1
  SET property_name_zh = CASE WHEN property_name_zh_is_custom THEN property_name_zh ELSE generated_premises_name_zh(NEW.bldg_name_zh, floor, unit) END,
      property_name_cn = CASE WHEN property_name_cn_is_custom THEN property_name_cn ELSE generated_premises_name_zh(NEW.bldg_name_cn, floor, unit) END
  WHERE property_id = NEW.property_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_v1_sync_premises_names_chinese ON properties_v1;
CREATE TRIGGER properties_v1_sync_premises_names_chinese
AFTER UPDATE OF bldg_name_zh, bldg_name_cn ON properties_v1
FOR EACH ROW EXECUTE FUNCTION sync_building_premises_names_chinese();
