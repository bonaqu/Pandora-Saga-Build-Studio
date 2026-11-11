# Link previews — Pandora Saga Build Studio

**Live page:** https://bonaqu.github.io/Pandora-Saga-Build-Studio/
**Preview image:** `assets/social-preview.jpg` (a committed static copy of `artifacts/layout/1920x1080.jpg`).

## Behavior

- Telegram, Discord, Facebook and compatible parsers read **static** Open Graph tags embedded in `index.html`, not a runtime-generated page.
- Page/card title: **Pandora Saga | Build Studio**; description: **Character Planner**, builds, skills, equipment and encyclopedia, RU/EN, plus **Version: 0.N.0**.
- Canonical base URL is always the GitHub Pages homepage, with an absolute, HTTPS, same-origin image URL. The release-specific image query string refreshes the asset cache after each release.
- Twitter/X uses `summary_large_image`; the image is stored in the repository to ensure availability without third-party hosting.
- Shared build URLs using `#b/<share-id>` use the **same general site preview**. URL hash fragments are not sent to the web server, so crawlers cannot render per-build previews from that client-side URL alone. Do not embed build names, account data or private build content in static meta tags.
- Locale switching is client-side. The static card uses international English as the primary preview and marks Russian as an available alternate locale. This allows one stable, language-neutral preview per URL.
- MESSENGER CACHE: the HTML and image become available on Pages after release, but Telegram and other platforms may keep older cached cards. This repository can verify its own HTML and image, not force external apps to refresh their caches. A new message or a tool such as Telegram's preview bot may show an updated result once the platform refetches it.

## Release workflow

`node scripts/release-version.mjs --check` checks OG and X descriptions against `package.json`. Bumping `YYYY.MM.DD.N` updates social descriptions and cache keys, as well as the existing site-version manifest and release metadata. The social-image content itself stays stable across releases.

CI checks use `tests/social-link-preview.test.mjs`; the read-only production readiness script verifies both public HTML and a JPEG response after deployment. This does not access or modify D1.
