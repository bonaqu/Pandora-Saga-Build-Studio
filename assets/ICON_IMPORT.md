# Offline original-game icon mirror

This one-time import operates locally on the saved 2026-10-30 game snapshot and downloads the source WebP icons to `assets/skills/icons`, `assets/items/icons`, and `assets/souls/icons`. It never runs in the browser, needs no GitHub Actions or paid service, and does not affect D1.

Run `node scripts/mirror-os-icons.mjs --dry-run` to see the expected total; run `node scripts/mirror-os-icons.mjs --limit=200` for a smaller first batch, then `node scripts/mirror-os-icons.mjs` to complete it. Each file is checked for a valid WebP RIFF signature and reused on later runs. The asset manifest is updated after each non-dry run, and locally mirrored icons become available to the website even before all icons are complete. Missing icons continue using their existing game-hosted fallback until they are mirrored.

The archive currently specifies **546 unique skill sprites, 880 item sprites, 11 soul sprites** (= 1437 icon paths) before verifying which source files are available. The manifest is authoritative only for files successfully downloaded, not for speculative mappings. After finishing: commit `assets/*/icons/*.webp` and `assets/os-icon-manifest.json` to `bonaqu_projects`. New icons arising from a later D1 import should be mirrored again using the updated source archive.
