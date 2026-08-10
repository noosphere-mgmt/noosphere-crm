UPDATE premises_v1
SET gross_area_sqm = ROUND(gross_area_sqft / 10.7639, 2)
WHERE gross_area_sqm IS NULL AND gross_area_sqft IS NOT NULL;

UPDATE premises_v1
SET gross_area_sqft = ROUND(gross_area_sqm * 10.7639, 2)
WHERE gross_area_sqft IS NULL AND gross_area_sqm IS NOT NULL;

UPDATE premises_v1
SET net_area_sqm = ROUND(net_area_sqft / 10.7639, 2)
WHERE net_area_sqm IS NULL AND net_area_sqft IS NOT NULL;

UPDATE premises_v1
SET net_area_sqft = ROUND(net_area_sqm * 10.7639, 2)
WHERE net_area_sqft IS NULL AND net_area_sqm IS NOT NULL;

