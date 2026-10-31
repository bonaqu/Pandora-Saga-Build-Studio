## Local verification and GitHub Actions checks

```bash
npm test
npm run assets:check
npm run assets:mirror -- --limit=200
```

`npm test` uses Node.js 20+ built-in test runner; no npm packages are downloaded or installed. It exercises catalog import, change previews, wiki index, equipment slots, and skill milestones. `assets:check` reports the original-game WebP assets truly present on disk without downloading anything. `assets:mirror` downloads missing original WebP icons to the categorized project asset library in checked-out repository, without Cloudflare credentials, GitHub Actions, or paid services. Do not confuse passing unit tests with a full browser-level test, and do not claim the library is complete until the expected/present/missing counts match and the files are committed.

GitHub Actions workflow [`.github/workflows/quality.yml`](../.github/workflows/quality.yml) automatically runs `npm test` and `npm run release:check` on source-branch pushes and pull requests. These checks use Node 22, do not require package downloads, and never touch Cloudflare D1 or production data. A successful CI run is still **not** a browser E2E, visual inspection, Cloudflare deployment, or confirmation of current-game formulas.

Chromium browser smoke runs in [`.github/workflows/browser-smoke.yml`](../.github/workflows/browser-smoke.yml) with pinned Playwright. It serves the local site and blocks remote D1/third-party calls, checking the portrait-only book, keyboard arrow navigation, level 1–55 and unsaved new-build choice. It does not validate live Cloudflare Worker/D1. Never claim browser E2E has passed until the actual GitHub Actions job is green.

The Chromium workflow also verifies sharing with a local Worker mock: save level-55 build, POST short ID, GET exact snapshot before showing a URL, copy to browser clipboard, and reject an altered snapshot. All real Worker calls are blocked; this is not a claim that live D1 is deployed.
