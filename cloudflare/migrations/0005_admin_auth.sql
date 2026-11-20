CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  password_changed_at TEXT
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  last_seen_at TEXT,
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id
ON admin_sessions(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at
ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  attempt_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL,
  blocked_until TEXT
);
