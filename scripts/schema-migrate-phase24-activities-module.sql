-- Phase 24: Activities module — subject, time, business activity_id

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS activity_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS activity_time TEXT NULL,
  ADD COLUMN IF NOT EXISTS subject TEXT NULL;

UPDATE activities
SET activity_id = 'act_' || replace(gen_random_uuid()::text, '-', '')
WHERE activity_id IS NULL;

ALTER TABLE activities ALTER COLUMN activity_id SET NOT NULL;

UPDATE activities SET activity_type = 'Site Tour' WHERE activity_type = 'Tour';
UPDATE activities SET activity_type = 'Proposal Sent' WHERE activity_type = 'Proposal';
UPDATE activities SET activity_type = 'Follow-up' WHERE activity_type = 'Follow Up';
UPDATE activities SET activity_type = 'Note' WHERE activity_type IN ('Email', 'Other');

CREATE INDEX IF NOT EXISTS idx_activities_opportunity ON activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_activities_premises ON activities(premises_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
