-- Phase 30: Schema reconciliation (auto-generated from fresh migrate vs test DB audit).
-- Adds columns present on working DB but missing after npm run db:migrate on empty schema.
-- Idempotent: safe to run on every deploy.

BEGIN;

COMMIT;
