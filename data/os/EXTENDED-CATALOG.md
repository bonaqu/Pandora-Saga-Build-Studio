# Complete self-hosted game catalog (2026-10-30)

The source consists of 16 original game-data categories (including meta) plus the official EN language overlay. D1 stores these in 19 versioned namespaces because trade metadata, approved Legacy translations, and serialized category payloads are retained separately. `tables`, `expertise`, `chests` and `stringsEn` are serialized in bounded, ordered fragments and reconstructed losslessly. `trades` uses 236 individual recipes plus one auxiliary `tradeMeta` record (NPC names, maps and reset limits).

The protected administrator importer reads all source files from **this repo**, validates the 12 original `meta.counts` categories, validates `meta.localeCounts.en` for official English, and checks all required D1 row counts. The Worker additionally parses the reconstructed serialized datasets before activation. Publication atomically updates only the active catalog pointer; incomplete imports cannot replace the existing version.

RU game data and EN overlay are used for user-facing catalog text. Legacy translations remain namespaced separately to avoid mismatching independent game IDs. No game formulas are synthesized from catalog fields.
