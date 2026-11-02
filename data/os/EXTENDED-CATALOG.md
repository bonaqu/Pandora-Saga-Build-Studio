# Complete self-hosted game catalog (2026-10-30)

The source consists of 16 original game-data categories (including meta) plus the official EN language overlay. D1 stores these in 19 versioned namespaces because trade metadata, approved Legacy translations, and serialized category payloads are retained separately. `tables`, `expertise`, `chests` and `stringsEn` are serialized in bounded, ordered fragments and reconstructed losslessly. `trades` uses 236 individual recipes plus one auxiliary `tradeMeta` record (NPC names, maps and reset limits).

The protected administrator importer reads all source files from **this repo**, validates the 12 original `meta.counts` categories, validates `meta.localeCounts.en` for official English, and checks all required D1 row counts. The Worker additionally parses the reconstructed serialized datasets before activation. Publication atomically updates only the active catalog pointer; incomplete imports cannot replace the existing version.

RU game data and EN overlay are used for user-facing catalog text. Legacy translations remain namespaced separately to avoid mismatching independent game IDs. No game formulas are synthesized from catalog fields.

## Verified live chest provenance (2026-11-02)

- Public game dataset: https://pandorasaga-os.com/gamedata/chests.json
- Frontend loader: `/assets/index-DPOp-XIe.js` loads `/gamedata/chests.json`. The `Chests-Dl7O5xbh.js` UI reads both NPC-exchanged chests and ordinary inventory boxes.
- The official live file, this repository's `data/os/chests.json`, and the read-only production D1 endpoint `/api/catalog/chests.json` were byte-identical on this audit.
- There are **32 `boxes`** and **12 `npc`** records, with item quantities and `p` probabilities wherever the game source lists them. For example, location chest `52011` (Maldia) has a defined loot table and must not be shown as unknown.
- `npc` entries remain distinct from `boxes` in both the editor and the immutable base catalog. The NPC chest `key` property is retained when editing drops; probabilities represent entries inside each source roll group, not an unconditional independent per-item rate.
- Some separately indexed *item-catalog* containers still have no published `rolls`; do not infer their contents or sell prices.
