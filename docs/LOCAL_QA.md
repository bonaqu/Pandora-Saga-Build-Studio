## Local verification (no GitHub Actions)

```bash
npm test
npm run assets:check
npm run assets:mirror -- --limit=200
```

`npm test` uses Node.js 20+ built-in test runner; no npm packages are downloaded or installed. It exercises catalog import, change previews, wiki index, equipment slots, and skill milestones. `assets:check` reports the original-game WebP assets truly present on disk without downloading anything. `assets:mirror` downloads missing original WebP icons to the categorized project asset library in checked-out repository, without Cloudflare credentials, GitHub Actions, or paid services. Do not confuse passing unit tests with a full browser-level test, and do not claim the library is complete until the expected/present/missing counts match and the files are committed.
