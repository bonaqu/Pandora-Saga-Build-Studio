-- Public immutable build shares. No user credentials and no changes to existing saved builds.
CREATE TABLE IF NOT EXISTS shared_builds (
 id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS shared_build_limits (
 ip_hash TEXT NOT NULL, day INTEGER NOT NULL, created INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(ip_hash,day)
);
CREATE INDEX IF NOT EXISTS idx_shared_builds_created ON shared_builds(created_at);
