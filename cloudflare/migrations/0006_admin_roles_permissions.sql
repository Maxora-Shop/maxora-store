ALTER TABLE admin_users
ADD COLUMN role TEXT NOT NULL DEFAULT 'employee_admin'
CHECK (role IN ('main_admin', 'employee_admin'));

UPDATE admin_users
SET role = 'main_admin'
WHERE LOWER(email) = LOWER('maxorashop.admin@gmail.com');

CREATE UNIQUE INDEX idx_admin_users_single_main_admin
ON admin_users(role)
WHERE role = 'main_admin';

CREATE TABLE admin_permissions (
  admin_id TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  granted_by TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (admin_id, permission_key),
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_permissions_admin_id
ON admin_permissions(admin_id);

CREATE TABLE admin_audit_logs (
  id TEXT PRIMARY KEY,
  actor_admin_id TEXT,
  target_admin_id TEXT,
  action TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (actor_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL,
  FOREIGN KEY (target_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE INDEX idx_admin_audit_logs_created_at
ON admin_audit_logs(created_at);

CREATE INDEX idx_admin_audit_logs_actor
ON admin_audit_logs(actor_admin_id);
