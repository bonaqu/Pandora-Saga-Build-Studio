# Offline original-game icon mirror

This one-time import operates locally on the saved 2026-10-30 game snapshot and downloads the source WebP icons to `assets/skills/icons`, `assets/items/icons`, and `assets/souls/icons`. It never runs in the browser, needs no GitHub Actions or paid service, and does not affect D1.

Run `node scripts/mirror-os-icons.mjs --dry-run` to see the expected total; run `node scripts/mirror-os-icons.mjs --limit=200` for a 200-image batch and repeat it to import the **next 200 missing images** automatically; run the script without a limit to complete everything. Each file is checked for a valid WebP RIFF signature and reused on later runs. The asset manifest is updated after each non-dry run, and locally mirrored icons become available to the website even before all icons are complete. Missing icons continue using their existing game-hosted fallback until they are mirrored.

The archive currently specifies **546 unique skill sprites, 880 item sprites, 11 soul sprites** (= 1437 icon paths) before verifying which source files are available. The manifest is authoritative only for files successfully downloaded, not for speculative mappings. After finishing: commit `assets/*/icons/*.webp` and `assets/os-icon-manifest.json` to `bonaqu_projects`. New icons arising from a later D1 import should be mirrored again using the updated source archive.

**Verified counts:** `--dry-run` checks actual files and never falsely marks them as downloaded. The summary distinguishes total expected icons, verified local icons, remaining missing icons and the number planned for the next batch. Each `--limit=N` invocation skips valid cached WebP files before choosing the next N.

## Offline integrity audit

Run `npm run assets:audit` after every transfer batch, and `npm run assets:audit:strict` only when you expect all 1437 original WebP assets to exist. It checks the manifest against actual files without network requests.
