-- Phase 49: opportunity document filing repository.

CREATE TABLE IF NOT EXISTS opportunity_documents (
  id              BIGSERIAL PRIMARY KEY,
  opportunity_id  BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'other',
  original_name   TEXT NOT NULL,
  stored_file     TEXT NOT NULL,
  mime_type       TEXT NOT NULL DEFAULT 'application/pdf',
  file_size       BIGINT NOT NULL DEFAULT 0,
  notes           TEXT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunity_documents_opportunity
  ON opportunity_documents (opportunity_id, created_at DESC);
