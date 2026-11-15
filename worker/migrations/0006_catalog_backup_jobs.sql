-- Additive migration only. No existing catalog data or player records change.
CREATE TABLE IF NOT EXISTS catalog_backup_jobs (
 snapshot TEXT PRIMARY KEY,state TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at INTEGER NOT NULL,lease_until INTEGER NOT NULL DEFAULT 0,
 updated_at INTEGER NOT NULL,last_error TEXT,result_json TEXT
);
