CREATE TABLE IF NOT EXISTS crm_users (
  id BIGSERIAL PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT,
  user_type TEXT NOT NULL DEFAULT 'human' CHECK (user_type IN ('human','virtual')),
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('administrator','staff','virtual_staff','view_only')),
  channel TEXT,
  coverage TEXT[] NOT NULL DEFAULT '{}',
  login_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  api_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS crm_users_email_unique ON crm_users(LOWER(email)) WHERE email IS NOT NULL;

