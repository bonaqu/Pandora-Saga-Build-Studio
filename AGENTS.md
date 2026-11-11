# Pandora Saga Build Studio — working rules for coding agents

These repository-level rules are durable instructions for future coding sessions.

## Source of truth and safety
- Work in `bonaqu_projects` through focused PRs. Inspect current branch HEAD, open PRs and relevant issues **once**, before editing.
- Keep all gameplay formulas, character state, saved Souls and catalog data unchanged unless the issue requires a verified change.
- Cloudflare D1 is authoritative for game data. Do not claim successful **production writes/rollback** from mocked CAS browser tests or read-only readiness. Issue #203 requires separate owner approval for any live temporary write.
- Owner-editable RU/EN UI copy uses existing D1 override keys and unified inline editors. Do not reveal internal IDs in player-facing text.

## Fast, safe verification
1. Identify the affected UI handler and existing related test before coding. Reuse current equipment open/replace/unequip paths instead of duplicating mutations.
2. Fetch related files in batches; make one coherent patch, with a focused Node regression and an isolated Chromium scenario before a PR.
3. If local dependencies are available, run `node --test tests/<affected>.test.mjs` first. For a single browser scenario run `node scripts/dev-server.mjs` and `node tests/browser-smoke.mjs --only=<scenario>`. This mode skips the global desktop baseline and all unrelated flows.
4. On GitHub Actions, `Chromium browser smoke` → **Run workflow** → select the branch and optional `scenario` input. **This is manual diagnostic feedback only.** PR validation still requires the full Node suite and the impact-classified (full for gameplay JS) Chromium suite before merge.
5. When a full browser run fails, inspect the failed job logs for the **first failing scenario**. Repair and run **that scenario** before repeating the full run. Do not trigger full 46+ scenario suites for each one-line test adjustment if the targeted diagnosis is available.
6. Do not merge a failing or pending PR. After merging, verify both automatic GitHub Pages deployment and production read-only Worker/catalog readiness; do not run redundant full Node/Chromium again on merge.
7. Leave concise, grounded PR and Issue logs with commit SHA, exact tests and remaining blockers. No speculative "fixed in production" claims.

## Why this is needed
2026-11-11: Releases 0.631.0–0.632.0 occupied roughly 27 minutes because two browser iterations in PR #422 repeated the full 46-scenario Chromium suite while isolating an Escape propagation issue, and another set of unit regressions had stale fixture assertions. The browser discovered a real regression; **retain the final full check**, but use isolated diagnostics to avoid repeated unrelated work. See `docs/DEVELOPMENT_PROCESS_TIME_OPTIMIZATION_2026-11-11.md`.
