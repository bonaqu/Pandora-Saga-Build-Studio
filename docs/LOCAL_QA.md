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

A separate read-only live diagnostic workflow [`.github/workflows/live-readonly.yml`](../.github/workflows/live-readonly.yml) runs on release-file pushes (with a wait for Pages to catch up), after a successful GitHub Pages workflow when GitHub emits that event, daily, or on manual dispatch. It checks the published release, Worker health, CORS preflight and a small real D1 catalog sample through the existing `npm run connection:check` script. It never uses credentials and never writes to the production database. A successful workflow indicates HTTP readiness at that moment, not gameplay correctness or transactional sharing success.

The same Chromium run captures five actual editor layouts (1366×768, 1920×1080, 2560×1440, 3840×2160 and 390×844), asserts no horizontal overflow, keeps the portrait centered inside its panel and the cursor neutral, then uploads JPEG screenshots and geometry.json as a 14-day GitHub Actions artifact. This is automated geometric QA; visual aesthetics still require human review.

The isolated share-link E2E now opens a shared link in a second browser context with its own level-22 draft. It checks cancellation leaves that draft untouched, explicit import loads the 55-level build, and a simulated HTTP 410 revoked link shows a clear owner-deleted notice without replacing the active character.
