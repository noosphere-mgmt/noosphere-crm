-- Canonical building types: Commercial / Industrial (was Commercial Building / Industrial Building).
UPDATE properties_v1
SET building_type = 'Commercial'
WHERE lower(trim(building_type)) IN ('commercial building', 'commercial', 'office');

UPDATE properties_v1
SET building_type = 'Industrial'
WHERE lower(trim(building_type)) IN ('industrial building', 'industrial');

DO $$
BEGIN
  IF to_regclass('public.buildings') IS NOT NULL THEN
    UPDATE buildings
    SET property_type = 'Commercial'
    WHERE lower(trim(property_type)) IN ('commercial building', 'office');

    UPDATE buildings
    SET property_type = 'Industrial'
    WHERE lower(trim(property_type)) IN ('industrial building');
  END IF;
END $$;
