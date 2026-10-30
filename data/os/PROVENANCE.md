# Pandora Saga OS — provenance, 30 October 2026

This repository contains a **fixed, self-hosted source snapshot** of the following 17 published JSON files from `https://pandorasaga-os.com/gamedata/`:

`meta.json`, `classes.json`, `skills.json`, `items.json`, `souls.json`, `monsters.json`, `drops.json`, `maps.json`, `instances.json`, `racialPassives.json`, `itemForth.json`, `unison.json`, `trades.json`, `tables.json`, `expertise.json`, `chests.json`, and the **official English overlay** `strings.en.json`.

- RU is the original source locale (`meta.baseLocale`).
- EN names and descriptions come from `strings.en.json` with source IDs, not from guessed translations. It includes, among others, 1,115 item names, 553 skills, 666 monsters, 112 souls and 28 classes.
- The user-owned, previously approved Legacy translations are independently preserved in `data/localization/legacy-approved.v1.json` and are **not** automatically assigned to modern OS IDs.
- Original source counts are validated before transfer to Cloudflare D1. Publishing a new snapshot requires a complete authenticated import; missing translations retain RU text.
- **No runtime synchronization** with the game server is used for JSON data. Until the first D1 publication, GitHub Pages serves this local snapshot as a contingency. Game icon URLs still require a separate self-hosting migration (Issue #2).
- These source snapshots may be outdated if the live server changes. Do not treat unverified combat calculations or unavailable drop sources as confirmed.
