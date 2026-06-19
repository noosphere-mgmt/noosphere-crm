-- Phase 25: Site tour checkpoints — group id + multiple premises per activity

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS activity_group_id TEXT NULL;

CREATE TABLE IF NOT EXISTS activity_premises (
  activity_id   TEXT NOT NULL REFERENCES activities(activity_id) ON DELETE CASCADE,
  premises_id   TEXT NOT NULL REFERENCES premises_v1(premises_id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (activity_id, premises_id)
);

CREATE INDEX IF NOT EXISTS idx_activities_group ON activities(activity_group_id);
CREATE INDEX IF NOT EXISTS idx_activity_premises_premises ON activity_premises(premises_id);
