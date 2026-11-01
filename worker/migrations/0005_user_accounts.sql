-- Account login is an alternative key to the SAME private library owner_hash.
-- Existing secret-key builds, public link source rows and tombstones remain in place.
CREATE TABLE IF NOT EXISTS user_accounts (
 id TEXT PRIMARY KEY,
 username TEXT NOT NULL UNIQUE COLLATE NOCASE,
 salt TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 owner_hash TEXT NOT NULL UNIQUE,
 recovery_hash TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS user_sessions (
 token_hash TEXT PRIMARY KEY,
 account_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE TABLE IF NOT EXISTS user_registration_limits (
 ip_hash TEXT NOT NULL,
 day INTEGER NOT NULL,
 created INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(ip_hash, day)
);
