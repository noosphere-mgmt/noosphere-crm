CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'new',
  contact_name TEXT,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  source TEXT NOT NULL DEFAULT 'email',
  email_subject TEXT,
  email_excerpt TEXT,
  email_message_id TEXT,
  email_thread_id TEXT,
  requirement_notes TEXT,
  ai_digest TEXT,
  office_space_required BOOLEAN,
  next_lease_expiry DATE,
  required_area_sqft NUMERIC(14,2),
  required_capacity_pax INTEGER,
  preferred_location TEXT,
  assigned_owner TEXT,
  virtual_staff TEXT,
  qualification_score INTEGER,
  qualification_reason TEXT,
  last_email_at TIMESTAMPTZ,
  next_follow_up_date DATE,
  converted_company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  converted_contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL,
  converted_opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leads_status_check CHECK (status IN ('new', 'reviewing', 'qualified', 'converted', 'nurture', 'disqualified', 'duplicate')),
  CONSTRAINT leads_score_check CHECK (qualification_score IS NULL OR qualification_score BETWEEN 0 AND 100)
);

CREATE UNIQUE INDEX IF NOT EXISTS leads_email_message_id_unique
  ON leads(email_message_id) WHERE email_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_status_updated_idx ON leads(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS leads_email_lower_idx ON leads(LOWER(email));
CREATE INDEX IF NOT EXISTS leads_company_lower_idx ON leads(LOWER(company_name));

