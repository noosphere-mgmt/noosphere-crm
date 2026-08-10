ALTER TABLE premises_v1
  DROP COLUMN IF EXISTS commission_from_seller,
  DROP COLUMN IF EXISTS commission_from_buyer,
  DROP COLUMN IF EXISTS commission_from_owner_operator,
  DROP COLUMN IF EXISTS commission_from_end_user;

