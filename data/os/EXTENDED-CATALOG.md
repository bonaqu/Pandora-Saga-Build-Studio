# Catalog extension — 2026-10-30

New datasets in `data/os/`: `monsters`, `drops`, `maps`, `instances`, `racialPassives`, `itemForth`, `unison`, `trades`. Legacy RU/EN/JP/TW approved translations in `data/localization/legacy-approved.v1.json` retain their original separate namespace. The D1 schema is unchanged: all groups are rows in the versioned `catalog_entries` table. Trades are preserved as 236 recipe entries plus one `tradeMeta` row with NPC names, map names and limit/reset metadata.

Publication requires exact counts of every required dataset including the localization set; partial imports never alter `catalog_current`. Trade data retains its original public API structure. This is a **manual one-time import**, not live game-server synchronization.
