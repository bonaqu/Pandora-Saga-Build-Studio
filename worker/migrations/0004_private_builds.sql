-- Private build library, keyed by SHA256 of a browser-held random token.
CREATE TABLE IF NOT EXISTS private_builds (
 owner_hash TEXT NOT NULL,
 build_id TEXT NOT NULL,
 payload TEXT NOT NULL,
 updated_at INTEGER NOT NULL,
 deleted_at INTEGER,
 PRIMARY KEY(owner_hash,build_id)
);
CREATE INDEX IF NOT EXISTS idx_private_builds_owner_time ON private_builds(owner_hash,updated_at DESC);
