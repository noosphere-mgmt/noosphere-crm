ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS property_name_en_is_custom BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE premises_v1 p
SET property_name_en_is_custom = (
  p.property_name_en IS NOT NULL
  AND p.property_name_en IS DISTINCT FROM generated_premises_name_en(b.bldg_name_en, p.floor, p.unit)
)
FROM properties_v1 b
WHERE b.property_id = p.property_id;

CREATE OR REPLACE FUNCTION sync_premises_name_en()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  building_name TEXT;
  generated_name TEXT;
BEGIN
  SELECT bldg_name_en INTO building_name FROM properties_v1 WHERE property_id = NEW.property_id;
  generated_name := generated_premises_name_en(building_name, NEW.floor, NEW.unit);

  IF TG_OP = 'INSERT' THEN
    NEW.property_name_en_is_custom := NEW.property_name_en IS NOT NULL
      AND NEW.property_name_en IS DISTINCT FROM generated_name;
    IF NOT NEW.property_name_en_is_custom THEN NEW.property_name_en := generated_name; END IF;
  ELSIF NEW.property_name_en IS DISTINCT FROM OLD.property_name_en THEN
    IF NEW.property_name_en_is_custom = FALSE AND OLD.property_name_en_is_custom = FALSE THEN
      NEW.property_name_en := generated_name;
    ELSE
      NEW.property_name_en_is_custom := NEW.property_name_en IS NOT NULL
        AND NEW.property_name_en IS DISTINCT FROM generated_name;
      IF NOT NEW.property_name_en_is_custom THEN NEW.property_name_en := generated_name; END IF;
    END IF;
  ELSIF NOT NEW.property_name_en_is_custom THEN
    NEW.property_name_en := generated_name;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_building_premises_names_en()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE premises_v1
  SET property_name_en = generated_premises_name_en(NEW.bldg_name_en, floor, unit),
      property_name_en_is_custom = FALSE
  WHERE property_id = NEW.property_id AND property_name_en_is_custom = FALSE;
  RETURN NEW;
END;
$$;

