-- Pandora Saga catalog, versioned and self-contained in D1.
-- Snapshot writes are staged; publication changes only catalog_current once verified.
CREATE TABLE IF NOT EXISTS catalog_entries (
 snapshot TEXT NOT NULL, dataset TEXT NOT NULL, record_key TEXT NOT NULL,
 name TEXT, kind TEXT, slot TEXT, is_costume_overlay INTEGER NOT NULL DEFAULT 0,
 payload TEXT NOT NULL,
 PRIMARY KEY(snapshot,dataset,record_key)
);
CREATE INDEX IF NOT EXISTS idx_catalog_slot ON catalog_entries(snapshot,dataset,slot,is_costume_overlay);
CREATE INDEX IF NOT EXISTS idx_catalog_kind ON catalog_entries(snapshot,dataset,kind);
CREATE TABLE IF NOT EXISTS catalog_current (
 id INTEGER PRIMARY KEY CHECK(id=1),
 snapshot TEXT NOT NULL, published_at INTEGER NOT NULL,
 expected_counts TEXT NOT NULL
);
