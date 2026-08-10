-- Phase 69: standardize premises space form values used by UI and CSV.
UPDATE premises_v1
SET space_form = CASE
  WHEN lower(btrim(space_form)) IN ('unit', 'suite', 'room', 'shop', 'warehouse', 'apartment') THEN 'Unit (s)'
  WHEN lower(btrim(space_form)) IN ('floor', 'whole floor') THEN 'Floor (s)'
  WHEN lower(btrim(space_form)) IN ('en-bloc', 'enbloc', 'building', 'portfolio', 'whole building') THEN 'Enbloc'
  WHEN lower(btrim(space_form)) = 'land' THEN 'Land'
  ELSE space_form
END
WHERE space_form IS NOT NULL;
