-- Phase 22: Opportunity source — free text (migrate legacy list values to labels)

UPDATE opportunities
SET source_type = CASE source_type
  WHEN 'operator_inventory' THEN 'Operator Inventory'
  WHEN 'market_listing' THEN 'Market Listing'
  ELSE source_type
END
WHERE source_type IN ('operator_inventory', 'market_listing');
